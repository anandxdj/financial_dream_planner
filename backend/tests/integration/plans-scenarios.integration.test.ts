import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { and, db, eq, financialSnapshots, households, planVersions, scenarios } from "../../src/database";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";
import {
  getCurrentPlan,
  getPlanHistory,
  recalculatePlan,
} from "../../src/modules/plans/plans.service";
import {
  applyScenario,
  compareScenarios,
  createScenario,
  getScenarioById,
  listScenarios,
  runScenario,
} from "../../src/modules/scenarios/scenarios.service";
import { computeCanonicalHash } from "../../src/shared/utils/canonical-json";

describe.skipIf(!isDockerAvailable())("plans and scenarios integration & concurrency", () => {
  let household1Id: string;
  let household2Id: string;

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
  });

  it("enforces immutable snapshots and monotonically increasing plan versions", async () => {
    const input1 = {
      asOf: "2026-08-30T10:00:00.000Z",
      revision: 0,
      inputs: {
        cashFlow: { income: "100000.00", essentialExpenses: "30000.00" },
      },
    };

    const res1 = await recalculatePlan(household1Id, input1);
    expect(res1.currentVersion.versionNumber).toBe(1);
    expect(res1.snapshot.revision).toBe(0);
    expect(res1.snapshot.inputHash).toBe(computeCanonicalHash(input1.inputs));

    const input2 = {
      asOf: "2026-08-30T11:00:00.000Z",
      revision: 1,
      inputs: {
        cashFlow: { income: "110000.00", essentialExpenses: "30000.00" },
      },
    };

    const res2 = await recalculatePlan(household1Id, input2);
    expect(res2.currentVersion.versionNumber).toBe(2);
    expect(res2.snapshot.revision).toBe(1);

    // Verify historical version 1 is unchanged
    const [v1] = await db
      .select()
      .from(planVersions)
      .where(and(eq(planVersions.planId, res1.plan.id), eq(planVersions.versionNumber, 1)));
    expect(v1.id).toBe(res1.currentVersion.id);

    const history = await getPlanHistory(household1Id, {});
    expect(history.data).toHaveLength(2);
    expect(history.data[0].version.versionNumber).toBe(2);
    expect(history.data[1].version.versionNumber).toBe(1);
  });

  it("proves runScenario has zero database side effects", async () => {
    await recalculatePlan(household1Id, {
      asOf: "2026-08-30T10:00:00.000Z",
      revision: 0,
      inputs: {
        cashFlow: { income: "100000.00", essentialExpenses: "40000.00" },
      },
    });

    const scen = await createScenario(household1Id, {
      name: "Run Only Test",
      overlay: {
        cashFlow: { income: "150000.00" },
      },
    });

    const initialSnapshots = await db.select().from(financialSnapshots);
    const initialVersions = await db.select().from(planVersions);
    const initialScenarios = await db.select().from(scenarios);

    const runResult = await runScenario(household1Id, scen.id);
    expect(runResult.baseline.cashFlow?.monthlyIncome).toBe("100000.00");
    expect(runResult.scenario.cashFlow?.monthlyIncome).toBe("150000.00");
    expect(runResult.deltas.cashFlow?.monthlyIncomeDelta).toBe("50000.00");

    const afterSnapshots = await db.select().from(financialSnapshots);
    const afterVersions = await db.select().from(planVersions);
    const afterScenarios = await db.select().from(scenarios);

    expect(afterSnapshots).toHaveLength(initialSnapshots.length);
    expect(afterVersions).toHaveLength(initialVersions.length);
    expect(afterScenarios).toHaveLength(initialScenarios.length);
  });

  it("handles concurrent apply race safely: exactly one wins and the other conflicts with 409", async () => {
    await recalculatePlan(household1Id, {
      asOf: "2026-08-30T10:00:00.000Z",
      revision: 0,
      inputs: {
        cashFlow: { income: "100000.00", essentialExpenses: "40000.00" },
      },
    });

    const scenA = await createScenario(household1Id, {
      name: "Scenario Alpha",
      overlay: {
        cashFlow: { income: "120000.00" },
      },
    });

    const scenB = await createScenario(household1Id, {
      name: "Scenario Beta",
      overlay: {
        cashFlow: { income: "130000.00" },
      },
    });

    // Concurrently apply Scenario A and Scenario B against the same initial Version 1 baseline
    const results = await Promise.allSettled([
      applyScenario(household1Id, scenA.id),
      applyScenario(household1Id, scenB.id),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const error = (rejected[0] as PromiseRejectedResult).reason;
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("SCENARIO_BASELINE_STALE");

    // Check database state: exactly 2 versions total (initial + the 1 winning apply)
    const allVersions = await db.select().from(planVersions).where(eq(planVersions.householdId, household1Id));
    expect(allVersions).toHaveLength(2);

    const currentPlan = await getCurrentPlan(household1Id);
    expect(currentPlan.currentVersion.versionNumber).toBe(2);
  });

  it("handles concurrent retries of the same scenario idempotently with zero duplicate versions", async () => {
    await recalculatePlan(household1Id, {
      asOf: "2026-08-30T10:00:00.000Z",
      revision: 0,
      inputs: {
        cashFlow: { income: "100000.00", essentialExpenses: "40000.00" },
      },
    });

    const scen = await createScenario(household1Id, {
      name: "Concurrent Retry Scenario",
      overlay: {
        cashFlow: { income: "125000.00" },
      },
    });

    // Concurrently apply the SAME scenario twice
    const [res1, res2] = await Promise.all([
      applyScenario(household1Id, scen.id),
      applyScenario(household1Id, scen.id),
    ]);

    expect(res1.version.id).toBe(res2.version.id);
    expect(res1.version.versionNumber).toBe(2);
    expect(res2.version.versionNumber).toBe(2);

    // Ensure only 2 versions exist in total (v1 and v2)
    const allVersions = await db.select().from(planVersions).where(eq(planVersions.householdId, household1Id));
    expect(allVersions).toHaveLength(2);
  });

  it("enforces tenant boundary on all service methods", async () => {
    await recalculatePlan(household1Id, {
      asOf: "2026-08-30T10:00:00.000Z",
      revision: 0,
      inputs: {
        cashFlow: { income: "100000.00" },
      },
    });

    const scen1 = await createScenario(household1Id, {
      name: "H1 Scenario",
      overlay: { cashFlow: { income: "120000.00" } },
    });

    // Household 2 attempts to access Household 1 resources
    expect(await listScenarios(household1Id)).toHaveLength(1);
    expect(await listScenarios(household2Id)).toHaveLength(0);
    await expect(getCurrentPlan(household2Id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(getScenarioById(household2Id, scen1.id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(runScenario(household2Id, scen1.id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(compareScenarios(household2Id, [scen1.id, scen1.id])).rejects.toMatchObject({ statusCode: 404 });
    await expect(applyScenario(household2Id, scen1.id)).rejects.toMatchObject({ statusCode: 404 });
  });
});
