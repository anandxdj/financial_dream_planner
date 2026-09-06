import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { eq, sql } from "drizzle-orm";
import { createApp } from "../../src/app";
import { COOKIE } from "../../src/config/constants";
import {
  db,
  financialSnapshots,
  householdPlanning,
  households,
  planGenerationRequests,
  plans,
  planVersions,
  planningGoals,
  users,
} from "../../src/database";
import {
  createGoal,
  feasibility,
  generate,
  getPlanning,
  mutateGoal,
  savePlanning,
} from "../../src/modules/planning/planning.service";
import { isDockerAvailable, resetTestDb, startTestDb, stopTestDb } from "../helpers/db";

const metadata = (income: string) => ({
  inputs: { cashFlow: { income, essentialExpenses: "30000.00", discretionaryExpenses: "10000.00" } },
  completedStep: 2,
  estimates: ["cashFlow.discretionaryExpenses"],
});

const goal = (name: string) => ({
  name,
  category: "savings" as const,
  targetAmount: "100000.00",
  currentSavings: "10000.00",
  monthlyContribution: "5000.00",
  targetDate: "2028-12-31",
});

function cookieValue(response: request.Response, name: string) {
  const header = response.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  return list.find((entry) => entry.startsWith(`${name}=`))?.split(";")[0]?.split("=")[1];
}

function csrfHeaders(response: request.Response) {
  return { Origin: "http://localhost:3000", "X-CSRF-Token": cookieValue(response, COOKIE.csrf)! };
}

describe.skipIf(!isDockerAvailable())("Release 1 planning PostgreSQL contracts", () => {
  const app = createApp();
  let householdId: string;
  let userId: string;

  beforeAll(startTestDb);
  afterAll(stopTestDb);

  beforeEach(async () => {
    await resetTestDb();
    const [household] = await db.insert(households).values({ name: "Planning household" }).returning();
    const [user] = await db.insert(users).values({ email: "planning.integration@example.com", displayName: "Planner" }).returning();
    householdId = household.id;
    userId = user.id;
  });

  it("keeps bodyless draft claim ownership scoped and denies overwriting saved planning", async () => {
    await resetTestDb();
    const first = request.agent(app);
    const second = request.agent(app);
    const firstRegistration = await first.post("/api/v1/auth/register").send({ email: "claim-one@example.com", password: "Password123!", displayName: "Claim One" });
    const secondRegistration = await second.post("/api/v1/auth/register").send({ email: "claim-two@example.com", password: "Password123!", displayName: "Claim Two" });

    const draft = await request(app).post("/api/v1/planning/drafts").send(metadata("90000.00"));
    expect(draft.status).toBe(201);
    expect(draft.body.data.estimates).toEqual(["cashFlow.discretionaryExpenses"]);
    const token = draft.body.data.draftToken;

    const claimed = await first.post(`/api/v1/planning/drafts/${token}/claim`).set(csrfHeaders(firstRegistration));
    expect(claimed.status).toBe(200);
    expect(claimed.body.data.inputs.cashFlow.income).toBe("90000.00");
    expect(claimed.body.data.revision).toBe(1);
    expect(await request(app).get(`/api/v1/planning/drafts/${token}`)).toMatchObject({ status: 404 });

    const crossHousehold = await second.post(`/api/v1/planning/drafts/${token}/claim`).set(csrfHeaders(secondRegistration));
    expect(crossHousehold.status).toBe(409);
    expect(crossHousehold.body.error.code).toBe("DRAFT_CLAIMED");

    const createdGoal = await first.post("/api/v1/goals").set(csrfHeaders(firstRegistration)).send(goal("HTTP goal"));
    expect(createdGoal.status).toBe(201);
    const updatedGoal = await first.patch(`/api/v1/goals/${createdGoal.body.data.id}`).set(csrfHeaders(firstRegistration)).send({ monthlyContribution: "5500.00", expectedRevision: 0 });
    expect(updatedGoal.status).toBe(200);
    expect(updatedGoal.body.data.revision).toBe(1);
    expect((await first.delete(`/api/v1/goals/${createdGoal.body.data.id}`).set(csrfHeaders(firstRegistration))).status).toBe(204);
    const generated = await first.post("/api/v1/households/planning/generate").set(csrfHeaders(firstRegistration)).set("Idempotency-Key", "http-generation-key").send({ expectedRevision: 4 });
    expect(generated.status).toBe(200);
    expect(generated.body.data.currentVersion.versionNumber).toBe(1);

    const saved = await second.put("/api/v1/households/planning").set(csrfHeaders(secondRegistration)).send({ ...metadata("70000.00"), expectedRevision: 0 });
    expect(saved.status).toBe(200);
    const replacement = await request(app).post("/api/v1/planning/drafts").send(metadata("120000.00"));
    const overwrite = await second.post(`/api/v1/planning/drafts/${replacement.body.data.draftToken}/claim`).set(csrfHeaders(secondRegistration));
    expect(overwrite.status).toBe(409);
    expect(overwrite.body.error.code).toBe("PLANNING_NOT_EMPTY");
    expect((await second.get("/api/v1/households/planning")).body.data.inputs.cashFlow.income).toBe("70000.00");
    expect((await request(app).get(`/api/v1/planning/drafts/${replacement.body.data.draftToken}`)).status).toBe(200);
  });

  it("serializes concurrent goal creation so exactly three goals commit", async () => {
    const outcomes = await Promise.allSettled([
      createGoal(householdId, goal("One")),
      createGoal(householdId, goal("Two")),
      createGoal(householdId, goal("Three")),
      createGoal(householdId, goal("Four")),
    ]);
    expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(3);
    const rejected = outcomes.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ statusCode: 409, code: "GOAL_LIMIT_REACHED" });
    expect(await db.select().from(planningGoals)).toHaveLength(3);
    expect((await getPlanning(householdId)).revision).toBe(3);
  });

  it("rejects stale saved inputs while keeping shared and goal revisions recoverable", async () => {
    const attempts = await Promise.allSettled([
      savePlanning(householdId, userId, metadata("80000.00"), 0),
      savePlanning(householdId, userId, metadata("85000.00"), 0),
    ]);
    expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = attempts.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ statusCode: 409, code: "REVISION_CONFLICT" });
    expect((await getPlanning(householdId)).revision).toBe(1);

    const created = await createGoal(householdId, goal("Emergency reserve"));
    expect((await getPlanning(householdId)).revision).toBe(2);
    await expect(savePlanning(householdId, userId, metadata("90000.00"), 1)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    const changed = await mutateGoal(householdId, created.id, { monthlyContribution: "6000.00" }, 0);
    expect(changed.revision).toBe(1);
    expect((await getPlanning(householdId)).revision).toBe(3);
    await expect(mutateGoal(householdId, created.id, { monthlyContribution: "7000.00" }, 0)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });

  it("returns one immutable original version for concurrent duplicate generation and later replay", async () => {
    await savePlanning(householdId, userId, metadata("100000.00"), 0);
    const [first, duplicate] = await Promise.all([
      generate(householdId, 1, "same-generation-key"),
      generate(householdId, 1, "same-generation-key"),
    ]);
    expect(duplicate.currentVersion.id).toBe(first.currentVersion.id);
    expect(await db.select().from(planVersions)).toHaveLength(1);
    expect(await db.select().from(planGenerationRequests)).toHaveLength(1);

    await savePlanning(householdId, userId, metadata("110000.00"), 1);
    const newer = await generate(householdId, 2, "new-generation-key");
    expect(newer.currentVersion.versionNumber).toBe(2);
    const replay = await generate(householdId, 999, "same-generation-key");
    expect(replay.currentVersion.id).toBe(first.currentVersion.id);
    expect(replay.currentVersion.versionNumber).toBe(1);
    expect(replay.plan.currentVersionId).toBe(first.currentVersion.id);
    expect((await db.select().from(plans))[0].currentVersionId).toBe(newer.currentVersion.id);
  });

  it("rolls back every generation write and preserves the active version on late failure", async () => {
    await savePlanning(householdId, userId, metadata("100000.00"), 0);
    const baseline = await generate(householdId, 1, "baseline-key");
    await savePlanning(householdId, userId, metadata("125000.00"), 1);

    await db.execute(sql.raw(`
      CREATE FUNCTION fail_selected_generation() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.idempotency_key = 'forced-failure-key' AND NEW.plan_version_id IS NOT NULL THEN
          RAISE EXCEPTION 'forced late generation failure';
        END IF;
        RETURN NEW;
      END;
      $$;
    `));
    await db.execute(sql.raw(`
      CREATE TRIGGER fail_selected_generation_trigger
      BEFORE UPDATE ON plan_generation_requests
      FOR EACH ROW EXECUTE FUNCTION fail_selected_generation();
    `));
    try {
      await expect(generate(householdId, 2, "forced-failure-key")).rejects.toThrow("forced late generation failure");
    } finally {
      await db.execute(sql.raw("DROP TRIGGER IF EXISTS fail_selected_generation_trigger ON plan_generation_requests"));
      await db.execute(sql.raw("DROP FUNCTION IF EXISTS fail_selected_generation()"));
    }

    expect((await db.select().from(plans))[0].currentVersionId).toBe(baseline.currentVersion.id);
    expect(await db.select().from(planVersions)).toHaveLength(1);
    expect(await db.select().from(financialSnapshots)).toHaveLength(1);
    expect(await db.select().from(planGenerationRequests).where(eq(planGenerationRequests.idempotencyKey, "forced-failure-key"))).toHaveLength(0);
    expect((await db.select().from(householdPlanning))[0].revision).toBe(2);
  });

  it("evaluates goal feasibility, keeps unknown capacity null, and flags combined over-allocation", async () => {
    const goalA = await createGoal(householdId, {
      ...goal("Goal A"),
      targetAmount: "60000.00",
      monthlyContribution: "5000.00",
      currentSavings: "0.00",
      targetDate: "2027-12-31",
    });
    expect(goalA.id).toBeDefined();

    const initFeas = await feasibility(householdId);
    expect(initFeas.availableMonthlyCapacity).toBeNull();
    expect(initFeas.overAllocated).toBe(false);
    expect(initFeas.goals).toHaveLength(1);
    expect(initFeas.goals[0].result.feasibility).toBe("unconstrained");
    expect(initFeas.goals[0].result.availableMonthlyCapacity).toBeNull();

    await savePlanning(householdId, userId, {
      inputs: {
        cashFlow: {
          income: "60000.00",
          essentialExpenses: "30000.00",
          discretionaryExpenses: "10000.00",
        },
      },
      completedStep: 2,
      estimates: [],
    }, 1);

    const feasibleResult = await feasibility(householdId);
    expect(feasibleResult.availableMonthlyCapacity).toBe("20000.00");
    expect(feasibleResult.combinedMonthlyContribution).toBe("5000.00");
    expect(feasibleResult.overAllocated).toBe(false);
    expect(feasibleResult.goals[0].result.feasibility).toBe("feasible");

    await createGoal(householdId, {
      ...goal("Goal B"),
      targetAmount: "200000.00",
      monthlyContribution: "18000.00",
      currentSavings: "0.00",
      targetDate: "2027-12-31",
    });

    const overAllocatedResult = await feasibility(householdId);
    expect(overAllocatedResult.availableMonthlyCapacity).toBe("20000.00");
    expect(overAllocatedResult.combinedMonthlyContribution).toBe("23000.00");
    expect(overAllocatedResult.overAllocated).toBe(true);

    await savePlanning(householdId, userId, {
      inputs: {
        cashFlow: {
          income: "30000.00",
          essentialExpenses: "35000.00",
          discretionaryExpenses: "5000.00",
        },
      },
      completedStep: 2,
      estimates: [],
    }, 3);

    const deficitResult = await feasibility(householdId);
    expect(deficitResult.availableMonthlyCapacity).toBe("-10000.00");
    expect(deficitResult.overAllocated).toBe(true);
    expect(deficitResult.goals[0].result.feasibility).toBe("infeasible");
  });

  it("enforces bodyless draft claims, unknown null preservation, and strict validation", async () => {
    const [emptyHousehold] = await db.insert(households).values({ name: "Empty household" }).returning();
    const planning = await getPlanning(emptyHousehold.id);
    expect(planning.revision).toBe(0);
    expect(planning.updatedBy).toBeNull();
    expect(planning.inputs).toEqual({});

    const agent = request.agent(app);
    const reg = await agent.post("/api/v1/auth/register").send({ email: "strict-test@example.com", password: "Password123!", displayName: "Strict" });
    const invalidPut = await agent
      .put("/api/v1/households/planning")
      .set(csrfHeaders(reg))
      .send({
        ...metadata("75000.00"),
        expectedRevision: 0,
        maliciousExtraProperty: "not_allowed",
      });
    expect(invalidPut.status).toBe(400);

    const draftRes = await request(app).post("/api/v1/planning/drafts").send(metadata("88000.00"));
    const token = draftRes.body.data.draftToken;
    const claimedRes = await agent
      .post(`/api/v1/planning/drafts/${token}/claim`)
      .set(csrfHeaders(reg))
      .send({ ignoredExtraPayload: "not_used" });
    expect(claimedRes.status).toBe(200);
    expect(claimedRes.body.data.inputs.cashFlow.income).toBe("88000.00");
    expect(claimedRes.body.data.updatedBy).toBeNull();
  });
});
