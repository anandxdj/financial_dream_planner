import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { COOKIE } from "../../src/config/constants";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";
import { db, financialSnapshots, planVersions } from "../../src/database";

const user1 = {
  email: "plans.user1@example.com",
  password: "Password123!",
  displayName: "Plan User 1",
};

const user2 = {
  email: "plans.user2@example.com",
  password: "Password123!",
  displayName: "Plan User 2",
};

function cookieValue(response: request.Response, name: string) {
  const header = response.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  return list.find((entry) => entry.startsWith(`${name}=`))?.split(";")[0]?.split("=")[1];
}

function csrfHeaders(response: request.Response) {
  return { Origin: "http://localhost:3000", "X-CSRF-Token": cookieValue(response, COOKIE.csrf)! };
}

describe.skipIf(!isDockerAvailable())("plans and scenarios API", () => {
  const app = createApp();

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  it("requires authentication for all plans and scenarios endpoints", async () => {
    const unauthRecalc = await request(app).post("/api/v1/plans/recalculate").send({});
    expect(unauthRecalc.status).toBe(401);

    const unauthCurrent = await request(app).get("/api/v1/plans/current");
    expect(unauthCurrent.status).toBe(401);

    const unauthHistory = await request(app).get("/api/v1/plans/history");
    expect(unauthHistory.status).toBe(401);

    const unauthCreateScenario = await request(app).post("/api/v1/scenarios").send({});
    expect(unauthCreateScenario.status).toBe(401);

    const unauthListScenarios = await request(app).get("/api/v1/scenarios");
    expect(unauthListScenarios.status).toBe(401);

    const unauthCompare = await request(app).post("/api/v1/scenarios/compare").send({});
    expect(unauthCompare.status).toBe(401);

    const unauthRun = await request(app).post("/api/v1/scenarios/00000000-0000-0000-0000-000000000000/run");
    expect(unauthRun.status).toBe(401);

    const unauthApply = await request(app).post("/api/v1/scenarios/00000000-0000-0000-0000-000000000000/apply");
    expect(unauthApply.status).toBe(401);
  });

  it("returns 404 for current plan when household has no plan", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send(user1);

    const res = await agent.get("/api/v1/plans/current");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PLAN_NOT_FOUND");
  });

  it("returns 400 when creating a scenario without an existing current plan", async () => {
    const agent = request.agent(app);
    const reg = await agent.post("/api/v1/auth/register").send(user1);

    const res = await agent.post("/api/v1/scenarios").set(csrfHeaders(reg)).send({
      name: "Early Retirement",
      overlay: {
        cashFlow: { income: "150000.00" },
      },
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NO_CURRENT_PLAN");
  });

  it("supports the complete plan recalculation, scenario draft, run, compare, and apply lifecycle", async () => {
    const agent1 = request.agent(app);
    const reg1 = await agent1.post("/api/v1/auth/register").send(user1);

    // 1. Recalculate baseline plan
    const recalcRes = await agent1.post("/api/v1/plans/recalculate").set(csrfHeaders(reg1)).send({
      asOf: "2026-08-30T10:00:00.000Z",
      revision: 0,
      inputs: {
        cashFlow: {
          income: "100000.00",
          essentialExpenses: "40000.00",
          discretionaryExpenses: "20000.00",
          emis: "0.00",
          mandatoryObligations: "0.00",
        },
        emergencyFund: {
          essentialExpenses: "40000.00",
          incomeStability: "stable",
          currentReserves: "100000.00",
        },
      },
    });

    expect(recalcRes.status).toBe(200);
    expect(recalcRes.body.data.plan.status).toBe("active");
    expect(recalcRes.body.data.currentVersion.versionNumber).toBe(1);
    expect(recalcRes.body.data.snapshot.revision).toBe(0);
    expect(recalcRes.body.data.snapshot.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(recalcRes.body.data.snapshot.outputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(recalcRes.body.data.snapshot.calculatedOutput.cashFlow.monthlySurplus).toBe("40000.00");

    const v1Id = recalcRes.body.data.currentVersion.id;

    // 2. Get current plan
    const currentRes = await agent1.get("/api/v1/plans/current");
    expect(currentRes.status).toBe(200);
    expect(currentRes.body.data.currentVersion.id).toBe(v1Id);
    expect(currentRes.body.data.currentVersion.versionNumber).toBe(1);

    // 3. Create Scenario A: Increase income
    const scenARes = await agent1.post("/api/v1/scenarios").set(csrfHeaders(reg1)).send({
      name: "Promotion +20k",
      description: "Income increased to 120k",
      overlay: {
        cashFlow: {
          income: "120000.00",
        },
      },
    });
    expect(scenARes.status).toBe(201);
    expect(scenARes.body.data.name).toBe("Promotion +20k");
    expect(scenARes.body.data.status).toBe("draft");
    expect(scenARes.body.data.baselineVersionId).toBe(v1Id);
    const scenAId = scenARes.body.data.id;

    // 4. Create Scenario B: Reduce discretionary expenses
    const scenBRes = await agent1.post("/api/v1/scenarios").set(csrfHeaders(reg1)).send({
      name: "Frugal Living",
      description: "Discretionary expenses down to 10k",
      overlay: {
        cashFlow: {
          discretionaryExpenses: "10000.00",
        },
      },
    });
    expect(scenBRes.status).toBe(201);
    const scenBId = scenBRes.body.data.id;

    // 5. List scenarios
    const listRes = await agent1.get("/api/v1/scenarios");
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(2);

    // 6. Get scenario by ID
    const getScenRes = await agent1.get(`/api/v1/scenarios/${scenAId}`);
    expect(getScenRes.status).toBe(200);
    expect(getScenRes.body.data.name).toBe("Promotion +20k");

    // 7. Run Scenario A without DB mutation
    const countSnapshotsBefore = (await db.select().from(financialSnapshots)).length;
    const countVersionsBefore = (await db.select().from(planVersions)).length;

    const runRes = await agent1.post(`/api/v1/scenarios/${scenAId}/run`).set(csrfHeaders(reg1));
    expect(runRes.status).toBe(200);
    expect(runRes.body.data.baseline.cashFlow.monthlySurplus).toBe("40000.00");
    expect(runRes.body.data.scenario.cashFlow.monthlySurplus).toBe("60000.00");
    expect(runRes.body.data.deltas.cashFlow.monthlySurplusDelta).toBe("20000.00");

    const countSnapshotsAfter = (await db.select().from(financialSnapshots)).length;
    const countVersionsAfter = (await db.select().from(planVersions)).length;
    expect(countSnapshotsAfter).toBe(countSnapshotsBefore);
    expect(countVersionsAfter).toBe(countVersionsBefore);

    // 8. Compare Scenarios in caller order
    const compRes = await agent1.post("/api/v1/scenarios/compare").set(csrfHeaders(reg1)).send({
      scenarioIds: [scenBId, scenAId],
    });
    expect(compRes.status).toBe(200);
    expect(compRes.body.data.baselineVersionId).toBe(v1Id);
    expect(compRes.body.data.scenarios).toHaveLength(2);
    // Preserves caller order (scenB first, then scenA)
    expect(compRes.body.data.scenarios[0].name).toBe("Frugal Living");
    expect(compRes.body.data.scenarios[1].name).toBe("Promotion +20k");

    // 9. Apply Scenario A -> creates Version 2
    const applyARes = await agent1.post(`/api/v1/scenarios/${scenAId}/apply`).set(csrfHeaders(reg1));
    expect(applyARes.status).toBe(200);
    expect(applyARes.body.data.version.versionNumber).toBe(2);
    expect(applyARes.body.data.snapshot.calculatedOutput.cashFlow.monthlyIncome).toBe("120000.00");
    expect(applyARes.body.data.snapshot.calculatedOutput.cashFlow.monthlySurplus).toBe("60000.00");
    expect(applyARes.body.data.snapshot.asOf).toBe("2026-08-30T10:00:00.000Z");
    expect(applyARes.body.data.snapshot.revision).toBe(0);
    const v2Id = applyARes.body.data.version.id;

    // Check current plan now points to Version 2
    const currentAfterApply = await agent1.get("/api/v1/plans/current");
    expect(currentAfterApply.body.data.currentVersion.id).toBe(v2Id);
    expect(currentAfterApply.body.data.currentVersion.versionNumber).toBe(2);

    // 10. Idempotent re-apply of Scenario A returns same Version 2 without creating Version 3
    const reapplyARes = await agent1.post(`/api/v1/scenarios/${scenAId}/apply`).set(csrfHeaders(reg1));
    expect(reapplyARes.status).toBe(200);
    expect(reapplyARes.body.data.version.id).toBe(v2Id);
    expect(reapplyARes.body.data.version.versionNumber).toBe(2);

    const totalVersionsAfterReapply = (await db.select().from(planVersions)).length;
    expect(totalVersionsAfterReapply).toBe(2);

    // 11. Stale baseline: applying Scenario B (which targeted Version 1 baseline) fails with 409
    const applyBRes = await agent1.post(`/api/v1/scenarios/${scenBId}/apply`).set(csrfHeaders(reg1));
    expect(applyBRes.status).toBe(409);
    expect(applyBRes.body.error.code).toBe("SCENARIO_BASELINE_STALE");

    // 12. History endpoint returns version 2 and version 1 in descending order
    const historyRes = await agent1.get("/api/v1/plans/history");
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data).toHaveLength(2);
    expect(historyRes.body.data[0].version.versionNumber).toBe(2);
    expect(historyRes.body.data[1].version.versionNumber).toBe(1);

    // 13. Mixed baseline comparison rejection
    // Create Scenario C targeting Version 2
    const scenCRes = await agent1.post("/api/v1/scenarios").set(csrfHeaders(reg1)).send({
      name: "Targeting V2",
      overlay: {
        cashFlow: { income: "130000.00" },
      },
    });
    expect(scenCRes.status).toBe(201);
    const scenCId = scenCRes.body.data.id;

    // Comparing Scenario B (targets V1) with Scenario C (targets V2) should fail with 400 SCENARIO_MIXED_BASELINES
    const mixedCompRes = await agent1.post("/api/v1/scenarios/compare").set(csrfHeaders(reg1)).send({
      scenarioIds: [scenBId, scenCId],
    });
    expect(mixedCompRes.status).toBe(400);
    expect(mixedCompRes.body.error.code).toBe("SCENARIO_MIXED_BASELINES");
  });

  it("enforces tenant isolation across households", async () => {
    const agent1 = request.agent(app);
    const reg1 = await agent1.post("/api/v1/auth/register").send(user1);

    const agent2 = request.agent(app);
    const reg2 = await agent2.post("/api/v1/auth/register").send(user2);

    // User 1 creates plan and scenario
    await agent1.post("/api/v1/plans/recalculate").set(csrfHeaders(reg1)).send({
      asOf: "2026-08-30T10:00:00.000Z",
      revision: 0,
      inputs: {
        cashFlow: { income: "100000.00" },
      },
    });

    const scen1 = await agent1.post("/api/v1/scenarios").set(csrfHeaders(reg1)).send({
      name: "User 1 Scenario",
      overlay: {
        cashFlow: { income: "120000.00" },
      },
    });
    const scen1Id = scen1.body.data.id;

    // User 2 cannot see User 1's plan or scenarios
    const u2Current = await agent2.get("/api/v1/plans/current");
    expect(u2Current.status).toBe(404);

    const u2Scenarios = await agent2.get("/api/v1/scenarios");
    expect(u2Scenarios.status).toBe(200);
    expect(u2Scenarios.body.data).toHaveLength(0);

    const u2GetScen = await agent2.get(`/api/v1/scenarios/${scen1Id}`);
    expect(u2GetScen.status).toBe(404);

    const u2RunScen = await agent2.post(`/api/v1/scenarios/${scen1Id}/run`).set(csrfHeaders(reg2));
    expect(u2RunScen.status).toBe(404);

    const u2ApplyScen = await agent2.post(`/api/v1/scenarios/${scen1Id}/apply`).set(csrfHeaders(reg2));
    expect(u2ApplyScen.status).toBe(404);
  });
});
