import { and, desc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db, type Database } from "../../database";
import {
  driftChecks,
  driftEvents,
  type SelectDriftCheck,
  type SelectDriftEvent,
  type DriftEventStatus,
  type DriftFinding,
} from "./model";
import {
  financialSnapshots,
  plans,
  planVersions,
  type SelectFinancialSnapshot,
  type SelectPlan,
  type SelectPlanVersion,
} from "../plans/model";
import { outboxEvents } from "../../database/models/platform";
import {
  evaluateScenario,
  type ScenarioDomainInputs,
} from "../financial-engine";
import { compareDrift } from "./comparator";
import { computeCanonicalHash } from "../../shared/utils/canonical-json";
import { AppError } from "../../shared/errors/app-error";
import { parseCursor, serializeCursor, type Cursor } from "../../shared/api/primitives";

export interface CreateDriftCheckInput {
  baselineVersionId: string;
  mode: "lightweight" | "deep";
  asOf: string;
  revision: number;
  inputs: ScenarioDomainInputs;
  idempotencyKey: string;
}

export function serializeDriftCheck(check: SelectDriftCheck) {
  return {
    id: check.id,
    householdId: check.householdId,
    baselineVersionId: check.baselineVersionId,
    mode: check.mode as "lightweight" | "deep",
    asOf: check.asOf.toISOString(),
    revision: check.revision,
    observedInputHash: check.observedInputHash,
    inputs: check.inputs,
    idempotencyKey: check.idempotencyKey,
    status: check.status as "queued" | "running" | "completed" | "failed",
    attempts: check.attempts,
    failureCode: check.failureCode ?? null,
    failureMessage: check.failureMessage ?? null,
    startedAt: check.startedAt ? check.startedAt.toISOString() : null,
    completedAt: check.completedAt ? check.completedAt.toISOString() : null,
    createdAt: check.createdAt.toISOString(),
    updatedAt: check.updatedAt.toISOString(),
    retentionExpiresAt: check.retentionExpiresAt.toISOString(),
  };
}

export function serializeDriftEvent(event: SelectDriftEvent) {
  return {
    id: event.id,
    householdId: event.householdId,
    checkId: event.checkId,
    baselineVersionId: event.baselineVersionId,
    status: event.status as "pending" | "kept" | "accepted" | "no_change",
    findings: event.findings,
    policyVersion: event.policyVersion,
    engineVersion: event.engineVersion,
    observedInputs: event.observedInputs,
    observedCalculatedOutput: event.observedCalculatedOutput ?? null,
    observedOutputHash: event.observedOutputHash,
    deltas: event.deltas ?? null,
    createdVersionId: event.createdVersionId ?? null,
    resolvedAt: event.resolvedAt ? event.resolvedAt.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
    retentionExpiresAt: event.retentionExpiresAt
      ? event.retentionExpiresAt.toISOString()
      : null,
  };
}

export async function createOrDeduplicateCheck(
  householdId: string,
  input: CreateDriftCheckInput,
): Promise<{ check: SelectDriftCheck; isNew: boolean; statusCode: 200 | 202 }> {
  const observedInputHash = computeCanonicalHash(input.inputs);
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${householdId}))`);

    const [plan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.householdId, householdId))
      .for("update");

    if (!plan || !plan.currentVersionId) {
      throw new AppError(404, "PLAN_NOT_FOUND", "No current plan found for household");
    }

    if (plan.currentVersionId !== input.baselineVersionId) {
      const [version] = await tx
        .select({ id: planVersions.id })
        .from(planVersions)
        .where(
          and(
            eq(planVersions.id, input.baselineVersionId),
            eq(planVersions.householdId, householdId),
          ),
        )
        .limit(1);
      if (!version) {
        throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Baseline plan version not found");
      }
      throw new AppError(409, "DRIFT_BASELINE_STALE", "Baseline version is not the current plan version");
    }

    const [existingByKey] = await tx
      .select()
      .from(driftChecks)
      .where(
        and(
          eq(driftChecks.householdId, householdId),
          eq(driftChecks.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);

    if (existingByKey) {
      const sameRequest =
        existingByKey.baselineVersionId === input.baselineVersionId &&
        existingByKey.mode === input.mode &&
        existingByKey.revision === input.revision &&
        existingByKey.observedInputHash === observedInputHash &&
        existingByKey.asOf.toISOString() === new Date(input.asOf).toISOString();
      if (!sameRequest) {
        throw new AppError(409, "DRIFT_IDEMPOTENCY_CONFLICT", "Idempotency key reused with different request payload");
      }
      const terminal = existingByKey.status === "completed" || existingByKey.status === "failed";
      return { check: existingByKey, isNew: false, statusCode: terminal ? 200 : 202 };
    }

    const [existingCanonical] = await tx
      .select()
      .from(driftChecks)
      .where(
        and(
          eq(driftChecks.householdId, householdId),
          eq(driftChecks.baselineVersionId, input.baselineVersionId),
          eq(driftChecks.mode, input.mode),
          eq(driftChecks.observedInputHash, observedInputHash),
          eq(driftChecks.revision, input.revision),
        ),
      )
      .limit(1);
    if (existingCanonical) {
      const terminal = existingCanonical.status === "completed" || existingCanonical.status === "failed";
      return { check: existingCanonical, isNew: false, statusCode: terminal ? 200 : 202 };
    }

    const retentionExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const [newCheck] = await tx
      .insert(driftChecks)
      .values({
        householdId,
        baselineVersionId: input.baselineVersionId,
        mode: input.mode,
        asOf: new Date(input.asOf),
        revision: input.revision,
        observedInputHash,
        inputs: input.inputs,
        idempotencyKey: input.idempotencyKey,
        status: "queued",
        attempts: 0,
        retentionExpiresAt,
      })
      .returning();

    await tx.insert(outboxEvents).values({
      topic: "drift_check",
      aggregateId: newCheck.id,
      payload: { checkId: newCheck.id, householdId: newCheck.householdId },
      availableAt: new Date(),
    });

    return {
      check: newCheck,
      isNew: true,
      statusCode: 202,
    };
  });
}

export async function processDriftCheck(
  checkId: string,
  customDb: Database = db,
): Promise<SelectDriftEvent | null> {
  try {
    return await customDb.transaction(async (tx) => {
    const [check] = await tx
      .select()
      .from(driftChecks)
      .where(eq(driftChecks.id, checkId))
      .for("update");

    if (!check) return null;

    if (check.status === "completed") {
      const [existingEvent] = await tx
        .select()
        .from(driftEvents)
        .where(eq(driftEvents.checkId, check.id))
        .limit(1);
      return existingEvent ?? null;
    }

    await tx
      .update(driftChecks)
      .set({
        status: "running",
        startedAt: check.startedAt ?? new Date(),
        attempts: sql`${driftChecks.attempts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(driftChecks.id, check.id));

    const [versionRow] = await tx
        .select({
          version: planVersions,
          snapshot: financialSnapshots,
        })
        .from(planVersions)
        .innerJoin(financialSnapshots, eq(financialSnapshots.id, planVersions.snapshotId))
        .where(
          and(
            eq(planVersions.id, check.baselineVersionId),
            eq(planVersions.householdId, check.householdId),
          ),
        )
        .limit(1);

      if (!versionRow) {
        throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Baseline plan version not found");
      }

      const comparison = compareDrift({
        baselineInputs: versionRow.snapshot.inputs,
        observedInputs: check.inputs,
        mode: check.mode as "lightweight" | "deep",
        financialPolicyVersion: versionRow.snapshot.policyVersion,
      });

      const eventStatus: DriftEventStatus = comparison.isMaterial ? "pending" : "no_change";
      const retentionExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      const [existingEvent] = await tx
        .select()
        .from(driftEvents)
        .where(eq(driftEvents.checkId, check.id))
        .limit(1);

      let eventRow: SelectDriftEvent;
      if (existingEvent) {
        eventRow = existingEvent;
      } else {
        const [insertedEvent] = await tx
          .insert(driftEvents)
          .values({
            householdId: check.householdId,
            checkId: check.id,
            baselineVersionId: check.baselineVersionId,
            status: eventStatus,
            findings: comparison.findings,
            policyVersion: comparison.policyVersion,
            engineVersion: comparison.engineVersion,
            observedInputs: check.inputs,
            observedCalculatedOutput: comparison.observedOutput,
            observedOutputHash: computeCanonicalHash(comparison.observedOutput),
            deltas: comparison.deltas ?? null,
            retentionExpiresAt,
          })
          .returning();
        eventRow = insertedEvent;
      }

      await tx
        .update(driftChecks)
        .set({
          status: "completed",
          completedAt: new Date(),
          failureCode: null,
          failureMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(driftChecks.id, check.id));

    return eventRow;
    });
  } catch (error: unknown) {
    const failureCode = error instanceof AppError ? error.code : "DRIFT_EVALUATION_ERROR";
    const failureMessage =
      error instanceof AppError ? error.message.slice(0, 1000) : "Drift evaluation failed";
    await customDb
      .update(driftChecks)
      .set({
        status: "failed",
        attempts: sql`${driftChecks.attempts} + 1`,
        failureCode,
        failureMessage,
        updatedAt: new Date(),
      })
      .where(eq(driftChecks.id, checkId));
    throw new AppError(500, failureCode, failureMessage);
  }
}

export async function getDriftCheckById(
  householdId: string,
  id: string,
): Promise<{ check: SelectDriftCheck; event: SelectDriftEvent | null }> {
  const now = new Date();
  const [check] = await db
    .select()
    .from(driftChecks)
    .where(
      and(
        eq(driftChecks.id, id),
        eq(driftChecks.householdId, householdId),
        gt(driftChecks.retentionExpiresAt, now),
      ),
    )
    .limit(1);

  if (!check) {
    throw new AppError(404, "DRIFT_CHECK_NOT_FOUND", "Drift check not found");
  }

  const [event] = await db
    .select()
    .from(driftEvents)
    .where(
      and(
        eq(driftEvents.checkId, check.id),
        eq(driftEvents.householdId, householdId),
        or(
          isNull(driftEvents.retentionExpiresAt),
          gt(driftEvents.retentionExpiresAt, now),
        ),
      ),
    )
    .limit(1);

  return { check, event: event ?? null };
}

export async function getCurrentPendingDriftEvent(
  householdId: string,
): Promise<SelectDriftEvent | null> {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.householdId, householdId))
    .limit(1);

  if (!plan || !plan.currentVersionId) {
    return null;
  }

  const now = new Date();
  const [event] = await db
    .select()
    .from(driftEvents)
    .where(
      and(
        eq(driftEvents.householdId, householdId),
        eq(driftEvents.baselineVersionId, plan.currentVersionId),
        eq(driftEvents.status, "pending"),
        or(
          isNull(driftEvents.retentionExpiresAt),
          gt(driftEvents.retentionExpiresAt, now),
        ),
      ),
    )
    .orderBy(desc(driftEvents.createdAt), desc(driftEvents.id))
    .limit(1);

  return event ?? null;
}

export async function listDriftEvents(
  householdId: string,
  query: { cursor?: string; limit?: number; status?: string },
): Promise<{ data: SelectDriftEvent[]; nextCursor?: string }> {
  const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
  const now = new Date();

  const conditions = [
    eq(driftEvents.householdId, householdId),
    or(
      isNull(driftEvents.retentionExpiresAt),
      gt(driftEvents.retentionExpiresAt, now),
    ),
  ];

  if (query.status) {
    conditions.push(eq(driftEvents.status, query.status));
  }

  if (query.cursor) {
    const parsed = parseCursor(query.cursor);
    conditions.push(
      sql`(${driftEvents.createdAt}, ${driftEvents.id}) < (${new Date(parsed.createdAt)}, ${parsed.id}::uuid)`,
    );
  }

  const rows = await db
    .select()
    .from(driftEvents)
    .where(and(...conditions))
    .orderBy(desc(driftEvents.createdAt), desc(driftEvents.id))
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const items = hasNext ? rows.slice(0, limit) : rows;

  let nextCursor: string | undefined;
  if (hasNext && items.length > 0) {
    const lastItem = items[items.length - 1];
    const cursorObj: Cursor = {
      id: lastItem.id,
      createdAt: lastItem.createdAt.toISOString(),
    };
    nextCursor = serializeCursor(cursorObj);
  }

  return { data: items, nextCursor };
}

export async function acceptDriftEvent(
  householdId: string,
  eventId: string,
): Promise<{
  event: SelectDriftEvent;
  plan: SelectPlan;
  version: SelectPlanVersion;
  snapshot: SelectFinancialSnapshot;
}> {
  return db.transaction(async (tx) => {
    // 1. Advisory transaction lock on household
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${householdId}))`);

    // 2. Lock drift event row
    const [event] = await tx
      .select()
      .from(driftEvents)
      .where(and(eq(driftEvents.id, eventId), eq(driftEvents.householdId, householdId)))
      .for("update");

    if (!event) {
      throw new AppError(404, "DRIFT_EVENT_NOT_FOUND", "Drift event not found");
    }

    // 3. Lock plan row
    const [plan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.householdId, householdId))
      .for("update");

    if (!plan || !plan.currentVersionId) {
      throw new AppError(404, "PLAN_NOT_FOUND", "Current plan not found");
    }

    // 4. Idempotent return if already accepted
    if (event.status === "accepted" && event.createdVersionId) {
      const [acceptedVersion] = await tx
        .select()
        .from(planVersions)
        .where(
          and(
            eq(planVersions.id, event.createdVersionId),
            eq(planVersions.householdId, householdId),
          ),
        )
        .limit(1);

      if (acceptedVersion) {
        const [acceptedSnapshot] = await tx
          .select()
          .from(financialSnapshots)
          .where(
            and(
              eq(financialSnapshots.id, acceptedVersion.snapshotId),
              eq(financialSnapshots.householdId, householdId),
            ),
          )
          .limit(1);

        if (acceptedSnapshot) {
          return {
            event,
            plan,
            version: acceptedVersion,
            snapshot: acceptedSnapshot,
          };
        }
      }
    }

    // 5. Already resolved checks
    if (event.status === "kept" || event.status === "no_change") {
      throw new AppError(
        409,
        "DRIFT_ALREADY_RESOLVED",
        `Drift event is already resolved with status ${event.status}`,
      );
    }

    // 6. Must be pending with at least one material finding
    if (event.status !== "pending") {
      throw new AppError(400, "DRIFT_NOT_PENDING", "Only pending drift events can be accepted");
    }

    if (!event.findings || (event.findings as DriftFinding[]).length === 0) {
      throw new AppError(
        400,
        "DRIFT_NO_MATERIAL_FINDINGS",
        "Cannot accept drift event with no material findings",
      );
    }

    // 7. Stale baseline check
    if (plan.currentVersionId !== event.baselineVersionId) {
      throw new AppError(
        409,
        "DRIFT_BASELINE_STALE",
        "Drift baseline is no longer the current plan version",
      );
    }

    // 8. Completed check verification
    const [check] = await tx
      .select()
      .from(driftChecks)
      .where(and(eq(driftChecks.id, event.checkId), eq(driftChecks.householdId, householdId)))
      .limit(1);

    if (!check) {
      throw new AppError(404, "DRIFT_CHECK_NOT_FOUND", "Associated drift check not found");
    }

    if (check.status !== "completed") {
      throw new AppError(409, "DRIFT_CHECK_NOT_COMPLETED", "Drift check is not completed");
    }

    if (check.baselineVersionId !== event.baselineVersionId) {
      throw new AppError(409, "DRIFT_BASELINE_MISMATCH", "Drift check and event baselines do not match");
    }

    const currentObservedHash = computeCanonicalHash(event.observedInputs);
    if (currentObservedHash !== check.observedInputHash) {
      throw new AppError(
        400,
        "DRIFT_HASH_MISMATCH",
        "Drift observed inputs do not match recorded check hash",
      );
    }

    // 9. Load baseline snapshot
    const [baselineVersion] = await tx
      .select()
      .from(planVersions)
      .where(
        and(
          eq(planVersions.id, event.baselineVersionId),
          eq(planVersions.householdId, householdId),
        ),
      )
      .limit(1);

    if (!baselineVersion) {
      throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Baseline plan version not found");
    }

    const [baselineSnapshot] = await tx
      .select()
      .from(financialSnapshots)
      .where(
        and(
          eq(financialSnapshots.id, baselineVersion.snapshotId),
          eq(financialSnapshots.householdId, householdId),
        ),
      )
      .limit(1);

    if (!baselineSnapshot) {
      throw new AppError(404, "SNAPSHOT_NOT_FOUND", "Baseline snapshot not found");
    }

    // 10. Evaluate new baseline plan from observed inputs
    const evalResult = evaluateScenario({
      name: "Accepted Drift Plan",
      baseline: event.observedInputs,
      scenario: {},
      policyVersion: baselineSnapshot.policyVersion,
    });

    const inputHash = computeCanonicalHash(event.observedInputs);
    const outputHash = computeCanonicalHash(evalResult.baseline);
    const verifiedComparison = compareDrift({
      baselineInputs: baselineSnapshot.inputs,
      observedInputs: event.observedInputs,
      mode: check.mode as "lightweight" | "deep",
      financialPolicyVersion: baselineSnapshot.policyVersion,
    });
    if (
      !verifiedComparison.isMaterial ||
      computeCanonicalHash(event.findings) !== computeCanonicalHash(verifiedComparison.findings) ||
      event.observedOutputHash !== outputHash ||
      computeCanonicalHash(event.observedCalculatedOutput) !== outputHash
    ) {
      throw new AppError(409, "DRIFT_OUTPUT_MISMATCH", "Drift output no longer matches its completed evaluation");
    }

    // 11. Next version number
    const [maxVerRow] = await tx
      .select({
        maxVer: sql<number>`coalesce(max(${planVersions.versionNumber}), 0)`,
      })
      .from(planVersions)
      .where(eq(planVersions.planId, plan.id));

    const nextVersionNumber = Number(maxVerRow?.maxVer ?? 0) + 1;

    // 12. Insert new snapshot
    const [newSnapshot] = await tx
      .insert(financialSnapshots)
      .values({
        householdId,
        asOf: check.asOf,
        revision: check.revision,
        engineVersion: "1.0.0",
        policyVersion: evalResult.policyVersion,
        inputs: event.observedInputs,
        resolvedAssumptions: evalResult.resolvedAssumptions,
        completeness: evalResult.completeness,
        inputHash,
        outputHash,
        calculatedOutput: evalResult.baseline,
      })
      .returning();

    // 13. Insert new plan version
    const [newVersion] = await tx
      .insert(planVersions)
      .values({
        householdId,
        planId: plan.id,
        versionNumber: nextVersionNumber,
        snapshotId: newSnapshot.id,
        assumptions: evalResult.resolvedAssumptions,
        scenarioOutput: evalResult,
      })
      .returning();

    // 14. Advance plan pointer
    const [updatedPlan] = await tx
      .update(plans)
      .set({
        currentVersionId: newVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, plan.id))
      .returning();

    // 15. Mark event as accepted with createdVersionId and retention null (indefinite provenance)
    const [updatedEvent] = await tx
      .update(driftEvents)
      .set({
        status: "accepted",
        createdVersionId: newVersion.id,
        resolvedAt: new Date(),
        retentionExpiresAt: null,
      })
      .where(eq(driftEvents.id, event.id))
      .returning();

    return {
      event: updatedEvent,
      plan: updatedPlan,
      version: newVersion,
      snapshot: newSnapshot,
    };
  });
}

export async function keepDriftEvent(
  householdId: string,
  eventId: string,
): Promise<SelectDriftEvent> {
  return db.transaction(async (tx) => {
    const [event] = await tx
      .select()
      .from(driftEvents)
      .where(and(eq(driftEvents.id, eventId), eq(driftEvents.householdId, householdId)))
      .for("update");

    if (!event) {
      throw new AppError(404, "DRIFT_EVENT_NOT_FOUND", "Drift event not found");
    }

    if (event.status === "kept") {
      return event;
    }

    if (event.status === "accepted" || event.status === "no_change") {
      throw new AppError(
        409,
        "DRIFT_ALREADY_RESOLVED",
        `Drift event cannot be kept because it is already resolved with status ${event.status}`,
      );
    }

    if (event.status !== "pending") {
      throw new AppError(400, "DRIFT_NOT_PENDING", "Only pending drift events can be kept");
    }

    const [updatedEvent] = await tx
      .update(driftEvents)
      .set({
        status: "kept",
        resolvedAt: new Date(),
      })
      .where(eq(driftEvents.id, event.id))
      .returning();

    return updatedEvent;
  });
}

export async function cleanupExpiredDriftRecords(
  options: { batchSize?: number; now?: Date } = {},
): Promise<{ deletedChecks: number; deletedEvents: number }> {
  const batchSize = options.batchSize ?? 100;
  const now = options.now ?? new Date();

  let deletedEvents = 0;
  let deletedChecks = 0;

  // 1. Delete expired drift_events that are strictly 'kept' or 'no_change'
  // NEVER delete pending or accepted events!
  const expiredEventRows = await db
    .select({ id: driftEvents.id })
    .from(driftEvents)
    .where(
      and(
        inArray(driftEvents.status, ["kept", "no_change"]),
        lte(driftEvents.retentionExpiresAt, now),
      ),
    )
    .limit(batchSize);

  if (expiredEventRows.length > 0) {
    const ids = expiredEventRows.map((r) => r.id);
    const deleted = await db
      .delete(driftEvents)
      .where(
        and(
          inArray(driftEvents.id, ids),
          inArray(driftEvents.status, ["kept", "no_change"]),
          lte(driftEvents.retentionExpiresAt, now),
        ),
      )
      .returning();
    deletedEvents = deleted.length;
  }

  // 2. Delete expired drift_checks that are 'completed' or 'failed' AND NOT linked to pending/accepted events
  const expiredCheckRows = await db
    .select({ id: driftChecks.id })
    .from(driftChecks)
    .where(
      and(
        inArray(driftChecks.status, ["completed", "failed"]),
        lte(driftChecks.retentionExpiresAt, now),
        sql`NOT EXISTS (
          SELECT 1 FROM ${driftEvents}
          WHERE ${driftEvents.checkId} = ${driftChecks.id}
          AND ${driftEvents.status} IN ('pending', 'accepted')
        )`,
      ),
    )
    .limit(batchSize);

  if (expiredCheckRows.length > 0) {
    const ids = expiredCheckRows.map((r) => r.id);
    const deleted = await db
      .delete(driftChecks)
      .where(
        and(
          inArray(driftChecks.id, ids),
          inArray(driftChecks.status, ["completed", "failed"]),
          lte(driftChecks.retentionExpiresAt, now),
          sql`NOT EXISTS (
            SELECT 1 FROM ${driftEvents}
            WHERE ${driftEvents.checkId} = ${driftChecks.id}
            AND ${driftEvents.status} IN ('pending', 'accepted')
          )`,
        ),
      )
      .returning();
    deletedChecks = deleted.length;
  }

  return { deletedChecks, deletedEvents };
}
