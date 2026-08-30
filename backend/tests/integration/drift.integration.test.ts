import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db, eq, households, outboxEvents, planVersions, driftChecks, driftEvents } from "../../src/database";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";
import { recalculatePlan } from "../../src/modules/plans/plans.service";
import {
  createOrDeduplicateCheck,
  processDriftCheck,
  getDriftCheckById,
  listDriftEvents,
  acceptDriftEvent,
  keepDriftEvent,
  cleanupExpiredDriftRecords,
} from "../../src/modules/drift/drift.service";
import { AppError } from "../../src/shared/errors/app-error";
import { computeCanonicalHash } from "../../src/shared/utils/canonical-json";
import { OutboxDispatcher } from "../../src/modules/jobs/outbox";
import type { Queue } from "bullmq";

describe.skipIf(!isDockerAvailable())("U7 Drift Integration & Concurrency", () => {
  let household1Id: string;
  let household2Id: string;
  let initialPlanVersionId: string;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();

    const [h1] = await db.insert(households).values({ name: "Household 1" }).returning();
    const [h2] = await db.insert(households).values({ name: "Household 2" }).returning();
    household1Id = h1.id;
    household2Id = h2.id;

    // Create initial plan for household 1
    const initialPlan = await recalculatePlan(household1Id, {
      asOf: "2026-08-30T10:00:00.000Z",
      revision: 0,
      inputs: {
        cashFlow: {
          income: "100000.00",
          essentialExpenses: "30000.00",
          discretionaryExpenses: "20000.00",
          emis: "10000.00",
          mandatoryObligations: "5000.00",
        },
        emergencyFund: {
          essentialExpenses: "30000.00",
          emis: "10000.00",
          mandatoryObligations: "5000.00",
          incomeStability: "stable",
          dependents: 0,
          currentReserves: "270000.00",
        },
      },
    });
    initialPlanVersionId = initialPlan.currentVersion.id;
  });

  it("enqueues outbox event and deduplicates check requests idempotently", async () => {
    const input = {
      baselineVersionId: initialPlanVersionId,
      mode: "lightweight" as const,
      asOf: "2026-08-30T11:00:00.000Z",
      revision: 1,
      inputs: {
        cashFlow: {
          income: "120000.00", // +20% income drift
          essentialExpenses: "30000.00",
          discretionaryExpenses: "20000.00",
          emis: "10000.00",
          mandatoryObligations: "5000.00",
        },
      },
      idempotencyKey: "drift-key-1",
    };

    // 1. Create check
    const res1 = await createOrDeduplicateCheck(household1Id, input);
    expect(res1.isNew).toBe(true);
    expect(res1.statusCode).toBe(202);
    expect(res1.check.status).toBe("queued");

    // Verify outbox entry
    const [outboxEntry] = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.aggregateId, res1.check.id));
    expect(outboxEntry).toBeDefined();
    expect(outboxEntry.topic).toBe("drift_check");

    const added: Array<{ name: string; data: unknown; options: { jobId?: string } }> = [];
    const queue = {
      add: async (name: string, data: unknown, options: { jobId?: string }) => {
        added.push({ name, data, options });
      },
    } as unknown as Queue;
    const dispatcher = new OutboxDispatcher(db, queue);
    expect(await dispatcher.dispatchBatch()).toBe(1);
    expect(added).toEqual([
      expect.objectContaining({ name: "drift_check", options: { jobId: res1.check.id } }),
    ]);
    expect(await dispatcher.dispatchBatch()).toBe(0);

    // 2. Same idempotency key with identical payload returns existing check (202)
    const res2 = await createOrDeduplicateCheck(household1Id, input);
    expect(res2.isNew).toBe(false);
    expect(res2.check.id).toBe(res1.check.id);
    expect(res2.statusCode).toBe(202);

    // 3. Same idempotency key with different payload throws 409 DRIFT_IDEMPOTENCY_CONFLICT
    const conflictingInput = {
      ...input,
      inputs: { cashFlow: { income: "130000.00" } },
    };
    await expect(
      createOrDeduplicateCheck(household1Id, conflictingInput),
    ).rejects.toThrow(AppError);

    // 4. Different idempotency key with identical canonical tuple deduplicates to same check
    const differentKeyInput = {
      ...input,
      idempotencyKey: "drift-key-2",
    };
    const res3 = await createOrDeduplicateCheck(household1Id, differentKeyInput);
    expect(res3.isNew).toBe(false);
    expect(res3.check.id).toBe(res1.check.id);
  });

  it("deduplicates concurrent canonical check creation and writes one outbox event", async () => {
    const base = {
      baselineVersionId: initialPlanVersionId,
      mode: "lightweight" as const,
      asOf: "2026-08-30T11:00:00.000Z",
      revision: 7,
      inputs: { cashFlow: { income: "120000.00" } },
    };
    const results = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        createOrDeduplicateCheck(household1Id, {
          ...base,
          idempotencyKey: `concurrent-create-${index}`,
        }),
      ),
    );
    expect(new Set(results.map((result) => result.check.id)).size).toBe(1);
    expect(results.filter((result) => result.isNew)).toHaveLength(1);
    const rows = await db.select().from(outboxEvents).where(eq(outboxEvents.aggregateId, results[0].check.id));
    expect(rows).toHaveLength(1);
  });

  it("processes drift check in worker, creates event, and guarantees at-most-one event idempotently", async () => {
    const input = {
      baselineVersionId: initialPlanVersionId,
      mode: "lightweight" as const,
      asOf: "2026-08-30T11:00:00.000Z",
      revision: 1,
      inputs: {
        cashFlow: {
          income: "120000.00",
          essentialExpenses: "30000.00",
          discretionaryExpenses: "20000.00",
          emis: "10000.00",
          mandatoryObligations: "5000.00",
        },
      },
      idempotencyKey: "worker-check-1",
    };

    const { check } = await createOrDeduplicateCheck(household1Id, input);

    // Process check in worker
    const event = await processDriftCheck(check.id);
    expect(event).toBeDefined();
    expect(event?.status).toBe("pending");
    expect(event?.findings.length).toBeGreaterThan(0);
    expect(event?.findings[0].code).toBe("income_changed");

    // Check row transitioned to completed
    const updatedCheck = (
      await db.select().from(driftChecks).where(eq(driftChecks.id, check.id))
    )[0];
    expect(updatedCheck.status).toBe("completed");
    expect(updatedCheck.attempts).toBe(1);

    // Repeated worker delivery is idempotent and does not create duplicate events
    const event2 = await processDriftCheck(check.id);
    expect(event2?.id).toBe(event?.id);

    const totalEvents = await db
      .select()
      .from(driftEvents)
      .where(eq(driftEvents.checkId, check.id));
    expect(totalEvents).toHaveLength(1);
  });

  it("records canonical no-op drift without permitting resolution or plan mutation", async () => {
    const baselineInputs = {
      cashFlow: {
        income: "100000.00",
        essentialExpenses: "30000.00",
        discretionaryExpenses: "20000.00",
        emis: "10000.00",
        mandatoryObligations: "5000.00",
      },
      emergencyFund: {
        essentialExpenses: "30000.00",
        emis: "10000.00",
        mandatoryObligations: "5000.00",
        incomeStability: "stable" as const,
        dependents: 0,
        currentReserves: "270000.00",
      },
    };
    const { check } = await createOrDeduplicateCheck(household1Id, {
      baselineVersionId: initialPlanVersionId,
      mode: "lightweight",
      asOf: "2026-08-30T11:00:00.000Z",
      revision: 1,
      inputs: baselineInputs,
      idempotencyKey: "no-op-check",
    });
    const event = await processDriftCheck(check.id);
    expect(event).toMatchObject({ status: "no_change", findings: [] });
    await expect(acceptDriftEvent(household1Id, event!.id)).rejects.toMatchObject({
      code: "DRIFT_ALREADY_RESOLVED",
      statusCode: 409,
    });
    await expect(keepDriftEvent(household1Id, event!.id)).rejects.toMatchObject({
      code: "DRIFT_ALREADY_RESOLVED",
      statusCode: 409,
    });
    const versions = await db.select().from(planVersions).where(eq(planVersions.householdId, household1Id));
    expect(versions).toHaveLength(1);
  });

  it("handles worker failure gracefully without corrupting plan state", async () => {
    // Insert a check with nonexistent baselineVersionId directly to trigger failure
    const [brokenCheck] = await db
      .insert(driftChecks)
      .values({
        householdId: household1Id,
        baselineVersionId: initialPlanVersionId,
        mode: "lightweight",
        asOf: new Date(),
        revision: 1,
        observedInputHash: "bad-hash",
        inputs: {
          // Provide malformed input that fails validation
          cashFlow: { income: "not-a-number" as unknown as string },
        } as unknown as Record<string, unknown>,
        idempotencyKey: "broken-check-1",
        status: "queued",
        attempts: 0,
        retentionExpiresAt: new Date(Date.now() + 86400000),
      })
      .returning();

    await expect(processDriftCheck(brokenCheck.id)).rejects.toBeDefined();

    const checkAfter = (
      await db.select().from(driftChecks).where(eq(driftChecks.id, brokenCheck.id))
    )[0];
    expect(checkAfter.status).toBe("failed");
    expect(checkAfter.failureCode).toBeDefined();
    expect(checkAfter.failureMessage).toBeDefined();
    expect(checkAfter.attempts).toBe(1);

    const repairedInputs = { cashFlow: { income: "120000.00" } };
    await db
      .update(driftChecks)
      .set({ inputs: repairedInputs, observedInputHash: computeCanonicalHash(repairedInputs) })
      .where(eq(driftChecks.id, brokenCheck.id));
    const recoveredEvent = await processDriftCheck(brokenCheck.id);
    expect(recoveredEvent).toBeDefined();
    const recoveredCheck = (await db.select().from(driftChecks).where(eq(driftChecks.id, brokenCheck.id)))[0];
    expect(recoveredCheck.status).toBe("completed");
    expect(recoveredCheck.attempts).toBe(2);
  });

  it("accepts drift event atomically, advances plan version, and is idempotent on repeated accept", async () => {
    const input = {
      baselineVersionId: initialPlanVersionId,
      mode: "lightweight" as const,
      asOf: "2026-08-30T11:00:00.000Z",
      revision: 1,
      inputs: {
        cashFlow: {
          income: "150000.00", // Income drift
          essentialExpenses: "30000.00",
          discretionaryExpenses: "20000.00",
          emis: "10000.00",
          mandatoryObligations: "5000.00",
        },
      },
      idempotencyKey: "accept-test-1",
    };

    const { check } = await createOrDeduplicateCheck(household1Id, input);
    const event = await processDriftCheck(check.id);
    expect(event).toBeDefined();

    const [acceptRes1, acceptRes2] = await Promise.all([
      acceptDriftEvent(household1Id, event!.id),
      acceptDriftEvent(household1Id, event!.id),
    ]);
    expect(acceptRes1.event.status).toBe("accepted");
    expect(acceptRes1.event.createdVersionId).toBeDefined();
    expect(acceptRes1.version.versionNumber).toBe(2);
    expect(acceptRes1.plan.currentVersionId).toBe(acceptRes1.version.id);

    // Concurrent duplicate acceptance returns the same version/snapshot idempotently.
    expect(acceptRes2.version.id).toBe(acceptRes1.version.id);
    expect(acceptRes2.snapshot.id).toBe(acceptRes1.snapshot.id);

    const versions = await db
      .select()
      .from(planVersions)
      .where(eq(planVersions.householdId, household1Id));
    expect(versions).toHaveLength(2);
  });

  it("rejects acceptance when persisted evaluation output fails integrity verification", async () => {
    const { check } = await createOrDeduplicateCheck(household1Id, {
      baselineVersionId: initialPlanVersionId,
      mode: "lightweight",
      asOf: "2026-08-30T11:00:00.000Z",
      revision: 1,
      inputs: { cashFlow: { income: "150000.00" } },
      idempotencyKey: "output-integrity",
    });
    const event = await processDriftCheck(check.id);
    await db.update(driftEvents).set({ observedOutputHash: "tampered" }).where(eq(driftEvents.id, event!.id));
    await expect(acceptDriftEvent(household1Id, event!.id)).rejects.toMatchObject({
      code: "DRIFT_OUTPUT_MISMATCH",
      statusCode: 409,
    });
    const versions = await db.select().from(planVersions).where(eq(planVersions.householdId, household1Id));
    expect(versions).toHaveLength(1);
  });

  it("rejects accept when baseline is stale due to an intervening recalculation or competing event", async () => {
    // 1. Create two competing checks against initialPlanVersionId
    const check1 = await createOrDeduplicateCheck(household1Id, {
      baselineVersionId: initialPlanVersionId,
      mode: "lightweight",
      asOf: "2026-08-30T11:00:00.000Z",
      revision: 1,
      inputs: { cashFlow: { income: "120000.00", essentialExpenses: "30000.00", discretionaryExpenses: "20000.00", emis: "10000.00", mandatoryObligations: "5000.00" } },
      idempotencyKey: "compete-1",
    });
    const check2 = await createOrDeduplicateCheck(household1Id, {
      baselineVersionId: initialPlanVersionId,
      mode: "lightweight",
      asOf: "2026-08-30T11:05:00.000Z",
      revision: 2,
      inputs: { cashFlow: { income: "130000.00", essentialExpenses: "30000.00", discretionaryExpenses: "20000.00", emis: "10000.00", mandatoryObligations: "5000.00" } },
      idempotencyKey: "compete-2",
    });

    const event1 = await processDriftCheck(check1.check.id);
    const event2 = await processDriftCheck(check2.check.id);

    const outcomes = await Promise.allSettled([
      acceptDriftEvent(household1Id, event1!.id),
      acceptDriftEvent(household1Id, event2!.id),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    const rejected = outcomes.find((outcome) => outcome.status === "rejected");
    expect(rejected).toBeDefined();
    expect((rejected as PromiseRejectedResult).reason).toMatchObject({
      code: "DRIFT_BASELINE_STALE",
      statusCode: 409,
    });
    const versions = await db.select().from(planVersions).where(eq(planVersions.householdId, household1Id));
    expect(versions).toHaveLength(2);
  });

  it("handles keep vs accept transitions and prevents invalid resolutions", async () => {
    const input = {
      baselineVersionId: initialPlanVersionId,
      mode: "lightweight" as const,
      asOf: "2026-08-30T11:00:00.000Z",
      revision: 1,
      inputs: { cashFlow: { income: "120000.00", essentialExpenses: "30000.00", discretionaryExpenses: "20000.00", emis: "10000.00", mandatoryObligations: "5000.00" } },
      idempotencyKey: "keep-test-1",
    };

    const { check } = await createOrDeduplicateCheck(household1Id, input);
    const event = await processDriftCheck(check.id);

    // 1. Keep drift event
    const kept = await keepDriftEvent(household1Id, event!.id);
    expect(kept.status).toBe("kept");

    // 2. Repeated keep is idempotent
    const keptAgain = await keepDriftEvent(household1Id, event!.id);
    expect(keptAgain.status).toBe("kept");

    // 3. Attempting to accept a kept event throws 409 DRIFT_ALREADY_RESOLVED
    await expect(acceptDriftEvent(household1Id, event!.id)).rejects.toSatisfy(
      (err: AppError) => err.code === "DRIFT_ALREADY_RESOLVED" && err.statusCode === 409,
    );
  });

  it("enforces tenant isolation and non-disclosure", async () => {
    const input = {
      baselineVersionId: initialPlanVersionId,
      mode: "lightweight" as const,
      asOf: "2026-08-30T11:00:00.000Z",
      revision: 1,
      inputs: { cashFlow: { income: "120000.00", essentialExpenses: "30000.00", discretionaryExpenses: "20000.00", emis: "10000.00", mandatoryObligations: "5000.00" } },
      idempotencyKey: "tenant-iso-1",
    };

    const { check } = await createOrDeduplicateCheck(household1Id, input);
    const event = await processDriftCheck(check.id);

    // Household 2 cannot access Household 1's check
    await expect(getDriftCheckById(household2Id, check.id)).rejects.toSatisfy(
      (err: AppError) => err.code === "DRIFT_CHECK_NOT_FOUND" && err.statusCode === 404,
    );

    // Household 2 cannot accept Household 1's event
    await expect(acceptDriftEvent(household2Id, event!.id)).rejects.toSatisfy(
      (err: AppError) => err.code === "DRIFT_EVENT_NOT_FOUND" && err.statusCode === 404,
    );

    // Household 2 cannot keep Household 1's event
    await expect(keepDriftEvent(household2Id, event!.id)).rejects.toSatisfy(
      (err: AppError) => err.code === "DRIFT_EVENT_NOT_FOUND" && err.statusCode === 404,
    );
  });

  it("filters expired records on read and deletes expired non-pending/accepted records during retention cleanup", async () => {
    // 1. Create a check and event with expired retention in the past
    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    const [expiredCheck] = await db
      .insert(driftChecks)
      .values({
        householdId: household1Id,
        baselineVersionId: initialPlanVersionId,
        mode: "lightweight",
        asOf: new Date(),
        revision: 1,
        observedInputHash: "expired-hash-1",
        inputs: { cashFlow: { income: "120000.00" } },
        idempotencyKey: "expired-check-1",
        status: "completed",
        retentionExpiresAt: pastDate,
      })
      .returning();

    const [expiredEvent] = await db
      .insert(driftEvents)
      .values({
        householdId: household1Id,
        checkId: expiredCheck.id,
        baselineVersionId: initialPlanVersionId,
        status: "kept",
        findings: [],
        policyVersion: "DRIFT-IN-2026.1",
        engineVersion: "1.0.0",
        observedInputs: { cashFlow: { income: "120000.00" } },
        observedOutputHash: "expired-output-hash",
        retentionExpiresAt: pastDate,
      })
      .returning();

    // Read filtering: getDriftCheckById hides expired check
    await expect(getDriftCheckById(household1Id, expiredCheck.id)).rejects.toSatisfy(
      (err: AppError) => err.code === "DRIFT_CHECK_NOT_FOUND" && err.statusCode === 404,
    );

    // List filtering hides expired event
    const listRes = await listDriftEvents(household1Id, {});
    expect(listRes.data.find((e) => e.id === expiredEvent.id)).toBeUndefined();

    // Bounded cleanup deletes expired kept event and check
    const cleanupResult = await cleanupExpiredDriftRecords({ batchSize: 100 });
    expect(cleanupResult.deletedChecks + cleanupResult.deletedEvents).toBeGreaterThanOrEqual(1);

    const checkInDb = await db
      .select()
      .from(driftChecks)
      .where(eq(driftChecks.id, expiredCheck.id));
    expect(checkInDb).toHaveLength(0);
  });
});
