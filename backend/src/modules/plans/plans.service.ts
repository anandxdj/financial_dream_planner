import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../database/client";
import {
  financialSnapshots,
  plans,
  planVersions,
  type SelectFinancialSnapshot,
  type SelectPlan,
  type SelectPlanVersion,
} from "./model";
import {
  evaluateScenario,
  type ScenarioDomainInputs,
  type ScenarioEvaluationOutput,
} from "../financial-engine";
import { computeCanonicalHash } from "../../shared/utils/canonical-json";
import { AppError } from "../../shared/errors/app-error";
import { parseCursor, serializeCursor, type Cursor } from "../../shared/api/primitives";
import type { Database } from "../../database/client";
import { compareDrift } from "../drift/comparator";
import { householdPlanning } from "../planning/model";

type PlanTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export interface RecalculatePlanInput {
  asOf: string;
  revision: number;
  inputs: ScenarioDomainInputs;
  policyVersion?: string;
}

export interface PlanWithVersionAndSnapshot {
  plan: SelectPlan;
  currentVersion: SelectPlanVersion;
  snapshot: SelectFinancialSnapshot;
}

export interface PlanHistoryDriftSummary {
  comparedToVersionId: string;
  isMaterial: boolean;
  findingCodes: string[];
  findingsCount: number;
  findings: any[];
  deltas: any;
}

export interface PlanHistoryItem {
  version: SelectPlanVersion;
  snapshot: SelectFinancialSnapshot;
  driftSummary?: PlanHistoryDriftSummary | null;
}

export interface PlanVersionDetail {
  version: SelectPlanVersion;
  snapshot: SelectFinancialSnapshot;
  isCurrent: boolean;
  drift: any | null;
}

export interface PlanHistoryResult {
  data: PlanHistoryItem[];
  nextCursor?: string;
}

export function serializePlan(plan: SelectPlan) {
  return {
    id: plan.id,
    householdId: plan.householdId,
    status: plan.status,
    currentVersionId: plan.currentVersionId,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export function serializePlanVersion(version: SelectPlanVersion) {
  return {
    id: version.id,
    householdId: version.householdId,
    planId: version.planId,
    versionNumber: version.versionNumber,
    snapshotId: version.snapshotId,
    assumptions: version.assumptions,
    scenarioOutput: version.scenarioOutput,
    createdAt: version.createdAt.toISOString(),
  };
}

export function serializeSnapshot(snapshot: SelectFinancialSnapshot) {
  return {
    id: snapshot.id,
    householdId: snapshot.householdId,
    asOf: snapshot.asOf.toISOString(),
    revision: snapshot.revision,
    engineVersion: snapshot.engineVersion,
    policyVersion: snapshot.policyVersion,
    inputs: snapshot.inputs,
    resolvedAssumptions: snapshot.resolvedAssumptions,
    completeness: snapshot.completeness,
    inputHash: snapshot.inputHash,
    outputHash: snapshot.outputHash,
    calculatedOutput: snapshot.calculatedOutput,
    createdAt: snapshot.createdAt.toISOString(),
  };
}

export async function recalculatePlanInTransaction(
  tx: PlanTransaction,
  householdId: string,
  input: RecalculatePlanInput,
): Promise<PlanWithVersionAndSnapshot> {
  const evalResult: ScenarioEvaluationOutput = evaluateScenario({
    name: "Baseline Plan",
    baseline: input.inputs,
    scenario: {},
    policyVersion: input.policyVersion,
  });

  const inputHash = computeCanonicalHash(input.inputs);
  const outputHash = computeCanonicalHash(evalResult.baseline);

  // The caller owns the transaction so planning generation can compose revision,
  // idempotency, snapshot, version, and current-pointer writes atomically.
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${householdId}))`);

    let [planRow] = await tx
      .select()
      .from(plans)
      .where(eq(plans.householdId, householdId))
      .for("update");

    if (!planRow) {
      const [newPlan] = await tx
        .insert(plans)
        .values({
          householdId,
          status: "active",
        })
        .returning();
      planRow = newPlan;
    }

    const [maxVerRow] = await tx
      .select({
        maxVer: sql<number>`coalesce(max(${planVersions.versionNumber}), 0)`,
      })
      .from(planVersions)
      .where(eq(planVersions.planId, planRow.id));

    const nextVersionNumber = Number(maxVerRow?.maxVer ?? 0) + 1;

    const [snapshotRow] = await tx
      .insert(financialSnapshots)
      .values({
        householdId,
        asOf: new Date(input.asOf),
        revision: input.revision,
        engineVersion: "1.0.0",
        policyVersion: evalResult.policyVersion,
        inputs: input.inputs,
        resolvedAssumptions: evalResult.resolvedAssumptions,
        completeness: evalResult.completeness,
        inputHash,
        outputHash,
        calculatedOutput: evalResult.baseline,
      })
      .returning();

    const [versionRow] = await tx
      .insert(planVersions)
      .values({
        householdId,
        planId: planRow.id,
        versionNumber: nextVersionNumber,
        snapshotId: snapshotRow.id,
        assumptions: evalResult.resolvedAssumptions,
        scenarioOutput: evalResult,
      })
      .returning();

    const [updatedPlan] = await tx
      .update(plans)
      .set({
        currentVersionId: versionRow.id,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, planRow.id))
      .returning();

  return {
    plan: updatedPlan,
    currentVersion: versionRow,
    snapshot: snapshotRow,
  };
}

export async function recalculatePlan(
  householdId: string,
  input: RecalculatePlanInput,
): Promise<PlanWithVersionAndSnapshot> {
  return db.transaction(async (tx) => {
    return recalculatePlanInTransaction(tx, householdId, input);
  });
}

export async function getCurrentPlan(householdId: string): Promise<PlanWithVersionAndSnapshot> {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.householdId, householdId))
    .limit(1);

  if (!plan || !plan.currentVersionId) {
    throw new AppError(404, "PLAN_NOT_FOUND", "No current plan found for household");
  }

  const [version] = await db
    .select()
    .from(planVersions)
    .where(and(eq(planVersions.id, plan.currentVersionId), eq(planVersions.householdId, householdId)))
    .limit(1);

  if (!version) {
    throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Current plan version not found");
  }

  const [snapshot] = await db
    .select()
    .from(financialSnapshots)
    .where(and(eq(financialSnapshots.id, version.snapshotId), eq(financialSnapshots.householdId, householdId)))
    .limit(1);

  if (!snapshot) {
    throw new AppError(404, "SNAPSHOT_NOT_FOUND", "Snapshot for current plan version not found");
  }

  return { plan, currentVersion: version, snapshot };
}

export async function getPlanHistory(
  householdId: string,
  query: { cursor?: string; limit?: number },
): Promise<PlanHistoryResult> {
  const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
  const conditions = [eq(planVersions.householdId, householdId)];

  if (query.cursor) {
    const parsed = parseCursor(query.cursor);
    conditions.push(
      sql`(${planVersions.createdAt}, ${planVersions.id}) < (${new Date(parsed.createdAt)}, ${parsed.id}::uuid)`,
    );
  }

  const rows = await db
    .select({
      version: planVersions,
      snapshot: financialSnapshots,
    })
    .from(planVersions)
    .innerJoin(financialSnapshots, eq(financialSnapshots.id, planVersions.snapshotId))
    .where(and(...conditions))
    .orderBy(desc(planVersions.createdAt), desc(planVersions.id))
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const items = hasNext ? rows.slice(0, limit) : rows;

  let nextCursor: string | undefined;
  if (hasNext && items.length > 0) {
    const lastItem = items[items.length - 1];
    const cursorObj: Cursor = {
      id: lastItem.version.id,
      createdAt: lastItem.version.createdAt.toISOString(),
    };
    nextCursor = serializeCursor(cursorObj);
  }

  const [currentPlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.householdId, householdId))
    .limit(1);

  let currentSnapshot: SelectFinancialSnapshot | null = null;
  if (currentPlan?.currentVersionId) {
    const [currSnapRow] = await db
      .select({ snapshot: financialSnapshots })
      .from(planVersions)
      .innerJoin(financialSnapshots, eq(financialSnapshots.id, planVersions.snapshotId))
      .where(and(eq(planVersions.id, currentPlan.currentVersionId), eq(planVersions.householdId, householdId)))
      .limit(1);
    currentSnapshot = currSnapRow?.snapshot ?? null;
  }

  const itemsWithDrift: PlanHistoryItem[] = items.map((item) => {
    let driftSummary: PlanHistoryDriftSummary | null = null;
    if (currentPlan?.currentVersionId && currentSnapshot) {
      if (item.version.id === currentPlan.currentVersionId) {
        driftSummary = {
          comparedToVersionId: currentPlan.currentVersionId,
          isMaterial: false,
          findingCodes: [],
          findingsCount: 0,
          findings: [],
          deltas: null,
        };
      } else {
        const driftResult = compareDrift({
          baselineInputs: currentSnapshot.inputs,
          observedInputs: item.snapshot.inputs,
          financialPolicyVersion: currentSnapshot.policyVersion,
        });
        driftSummary = {
          comparedToVersionId: currentPlan.currentVersionId,
          isMaterial: driftResult.isMaterial,
          findingCodes: driftResult.findings.map((f) => f.code),
          findingsCount: driftResult.findings.length,
          findings: driftResult.findings,
          deltas: driftResult.deltas,
        };
      }
    }
    return {
      version: item.version,
      snapshot: item.snapshot,
      driftSummary,
    };
  });

  return { data: itemsWithDrift, nextCursor };
}

export async function getPlanVersionById(
  householdId: string,
  versionId: string,
): Promise<PlanVersionDetail> {
  const [row] = await db
    .select({
      version: planVersions,
      snapshot: financialSnapshots,
    })
    .from(planVersions)
    .innerJoin(financialSnapshots, eq(financialSnapshots.id, planVersions.snapshotId))
    .where(and(eq(planVersions.id, versionId), eq(planVersions.householdId, householdId)))
    .limit(1);

  if (!row) {
    throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Plan version not found");
  }

  const [currentPlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.householdId, householdId))
    .limit(1);

  const isCurrent = currentPlan?.currentVersionId === versionId;
  let drift: any = null;

  if (!isCurrent && currentPlan?.currentVersionId) {
    const [currentVersionRow] = await db
      .select({ snapshot: financialSnapshots })
      .from(planVersions)
      .innerJoin(financialSnapshots, eq(financialSnapshots.id, planVersions.snapshotId))
      .where(and(eq(planVersions.id, currentPlan.currentVersionId), eq(planVersions.householdId, householdId)))
      .limit(1);

    if (currentVersionRow?.snapshot) {
      drift = compareDrift({
        baselineInputs: currentVersionRow.snapshot.inputs,
        observedInputs: row.snapshot.inputs,
        mode: "deep",
        financialPolicyVersion: currentVersionRow.snapshot.policyVersion,
      });
    }
  }

  return {
    version: row.version,
    snapshot: row.snapshot,
    isCurrent,
    drift,
  };
}

export async function restorePlanVersion(
  householdId: string,
  versionId: string,
  options: { expectedRevision?: number; userId?: string } = {},
): Promise<PlanWithVersionAndSnapshot> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${householdId}))`);

    const [target] = await tx
      .select({
        version: planVersions,
        snapshot: financialSnapshots,
      })
      .from(planVersions)
      .innerJoin(financialSnapshots, eq(financialSnapshots.id, planVersions.snapshotId))
      .where(and(eq(planVersions.id, versionId), eq(planVersions.householdId, householdId)))
      .for("update");

    if (!target) {
      throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Plan version not found");
    }

    const [planning] = await tx
      .select()
      .from(householdPlanning)
      .where(eq(householdPlanning.householdId, householdId))
      .for("update")
      .limit(1);

    if (options.expectedRevision !== undefined) {
      const currentRev = planning?.revision ?? 0;
      if (currentRev !== options.expectedRevision) {
        throw new AppError(409, "REVISION_CONFLICT", "Planning revision conflict");
      }
    }

    const nextRevision = (planning?.revision ?? 0) + 1;
    if (planning) {
      await tx
        .update(householdPlanning)
        .set({
          inputs: target.snapshot.inputs,
          revision: nextRevision,
          updatedBy: options.userId ?? planning.updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(householdPlanning.householdId, householdId));
    } else {
      await tx.insert(householdPlanning).values({
        householdId,
        inputs: target.snapshot.inputs,
        completedStep: 3,
        estimates: [],
        revision: nextRevision,
        updatedBy: options.userId ?? null,
      });
    }

    const result = await recalculatePlanInTransaction(tx, householdId, {
      asOf: new Date().toISOString(),
      revision: nextRevision,
      inputs: target.snapshot.inputs,
      policyVersion: target.snapshot.policyVersion,
    });

    return result;
  });
}
