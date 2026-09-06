import Decimal from "decimal.js";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../../database";
import type { Database } from "../../database/client";
import { AppError } from "../../shared/errors/app-error";
import { generateOpaqueToken, hashToken } from "../../utils/crypto";
import { calculateGoalFunding } from "../financial-engine/goal-funding";
import { financialSnapshots, plans, planVersions } from "../plans/model";
import { recalculatePlanInTransaction } from "../plans/plans.service";
import { goalSchema, householdPlanning, planGenerationRequests, planningDrafts, planningGoals, type PlanningInputs } from "./model";
import type { z } from "zod";

type GoalInput = z.infer<typeof goalSchema>;
type Meta = { inputs: PlanningInputs; completedStep: number; estimates: string[] };
type PlanningTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

function conflict() {
  return new AppError(409, "REVISION_CONFLICT", "Revision is stale; fetch the latest resource and retry");
}

function horizon(date: string) {
  return Math.max(1, Math.ceil((new Date(`${date}T00:00:00Z`).getTime() - Date.now()) / (30.4375 * 86400000)));
}

async function lockHousehold(tx: PlanningTransaction, householdId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${householdId}))`);
}

async function lockPlanning(tx: PlanningTransaction, householdId: string) {
  await tx.insert(householdPlanning).values({ householdId }).onConflictDoNothing();
  const [row] = await tx.select().from(householdPlanning).where(eq(householdPlanning.householdId, householdId)).for("update").limit(1);
  return row;
}

export function affordability(i: { purchaseAmount: string; income: string; expenses: string; liquidSavings?: string; bufferMonths: number }) {
  const purchase = new Decimal(i.purchaseAmount);
  const income = new Decimal(i.income);
  const expenses = new Decimal(i.expenses);
  const savings = new Decimal(i.liquidSavings ?? 0);
  const surplus = income.minus(expenses);
  if ([purchase, income, expenses, savings].some((v) => v.isNegative())) return { verdict: "insufficient_data", monthlySurplus: null, bufferImpact: null, timeToAffordMonths: null, comparison: { buyNow: "0.00", waitThreeMonths: "0.00" }, explanation: "Financial amounts must be non-negative." };
  const reserve = expenses.times(i.bufferMonths);
  const buy = savings.minus(purchase);
  const wait = savings.plus(surplus.times(3)).minus(purchase);
  const verdict = buy.gte(reserve) ? "safe" : wait.gte(reserve) ? "tight" : surplus.gt(0) ? "risky" : "insufficient_data";
  return { verdict, monthlySurplus: surplus.toFixed(2), bufferImpact: buy.minus(reserve).toFixed(2), timeToAffordMonths: surplus.gt(0) ? Math.max(0, Math.ceil(purchase.minus(savings).div(surplus).toNumber())) : null, comparison: { buyNow: buy.toFixed(2), waitThreeMonths: wait.toFixed(2) }, explanation: verdict === "safe" ? "You can buy now and preserve the buffer." : verdict === "tight" ? "Waiting three months improves affordability." : verdict === "risky" ? "This purchase would compromise your buffer." : "No positive surplus is available." };
}

async function anon(token: string) {
  const [row] = await db.select().from(planningDrafts).where(and(eq(planningDrafts.tokenHash, hashToken(token)), isNull(planningDrafts.claimedHouseholdId), gt(planningDrafts.expiresAt, new Date()))).limit(1);
  if (!row) throw new AppError(404, "DRAFT_NOT_FOUND", "Draft not found or expired");
  return row;
}

export async function createDraft(m: Meta = { inputs: {}, completedStep: 0, estimates: [] }) {
  const token = generateOpaqueToken();
  const [row] = await db.insert(planningDrafts).values({ tokenHash: hashToken(token), inputs: m.inputs, completedStep: m.completedStep, estimates: m.estimates, expiresAt: new Date(Date.now() + 7 * 86400000) }).returning();
  return { token, row };
}

export const getDraft = anon;

export async function updateDraft(token: string, m: Meta, revision: number) {
  const row = await anon(token);
  if (row.revision !== revision) throw conflict();
  const [out] = await db.update(planningDrafts).set({ inputs: m.inputs, completedStep: m.completedStep, estimates: m.estimates, revision: revision + 1, updatedAt: new Date() }).where(and(eq(planningDrafts.id, row.id), eq(planningDrafts.revision, revision), isNull(planningDrafts.claimedHouseholdId))).returning();
  if (!out) throw conflict();
  return out;
}

export async function claimDraft(token: string, householdId: string) {
  return db.transaction(async (tx) => {
    await lockHousehold(tx, householdId);
    const [draft] = await tx.select().from(planningDrafts).where(and(eq(planningDrafts.tokenHash, hashToken(token)), gt(planningDrafts.expiresAt, new Date()))).for("update").limit(1);
    if (!draft) throw new AppError(404, "DRAFT_NOT_FOUND", "Draft not found or expired");
    if (draft.claimedHouseholdId) throw new AppError(409, "DRAFT_CLAIMED", "Draft has already been claimed");

    const planning = await lockPlanning(tx, householdId);
    const [{ count }] = await tx.select({ count: sql<number>`count(*)` }).from(planningGoals).where(and(eq(planningGoals.householdId, householdId), eq(planningGoals.status, "active")));
    if (planning.revision !== 0 || Object.keys(planning.inputs ?? {}).length > 0 || planning.completedStep !== 0 || planning.estimates.length > 0 || Number(count) > 0) {
      throw new AppError(409, "PLANNING_NOT_EMPTY", "Household already has planning data");
    }

    const [saved] = await tx.update(householdPlanning).set({ inputs: draft.inputs, completedStep: draft.completedStep, estimates: draft.estimates, revision: 1, updatedAt: new Date() }).where(and(eq(householdPlanning.householdId, householdId), eq(householdPlanning.revision, 0))).returning();
    if (!saved) throw conflict();
    const [claimed] = await tx.update(planningDrafts).set({ claimedHouseholdId: householdId, updatedAt: new Date() }).where(and(eq(planningDrafts.id, draft.id), isNull(planningDrafts.claimedHouseholdId))).returning();
    if (!claimed) throw new AppError(409, "DRAFT_CLAIMED", "Draft has already been claimed");
    return saved;
  });
}

export async function getPlanning(householdId: string) {
  const [row] = await db.select().from(householdPlanning).where(eq(householdPlanning.householdId, householdId)).limit(1);
  return row ?? { householdId, inputs: {}, completedStep: 0, estimates: [], revision: 0, updatedBy: null, updatedAt: new Date() };
}

export async function savePlanning(householdId: string, userId: string, m: Meta, revision: number) {
  return db.transaction(async (tx) => {
    await lockHousehold(tx, householdId);
    const old = await lockPlanning(tx, householdId);
    if (old.revision !== revision) throw conflict();
    const [out] = await tx.update(householdPlanning).set({ inputs: m.inputs, completedStep: m.completedStep, estimates: m.estimates, revision: revision + 1, updatedBy: userId, updatedAt: new Date() }).where(and(eq(householdPlanning.householdId, householdId), eq(householdPlanning.revision, revision))).returning();
    if (!out) throw conflict();
    return out;
  });
}

export async function listGoals(householdId: string) {
  return db.select().from(planningGoals).where(and(eq(planningGoals.householdId, householdId), eq(planningGoals.status, "active"))).orderBy(desc(planningGoals.createdAt));
}

export async function createGoal(householdId: string, input: GoalInput) {
  return db.transaction(async (tx) => {
    await lockHousehold(tx, householdId);
    const planning = await lockPlanning(tx, householdId);
    const [{ count }] = await tx.select({ count: sql<number>`count(*)` }).from(planningGoals).where(and(eq(planningGoals.householdId, householdId), eq(planningGoals.status, "active")));
    if (Number(count) >= 3) throw new AppError(409, "GOAL_LIMIT_REACHED", "At most three active goals are allowed");
    const [out] = await tx.insert(planningGoals).values({ householdId, ...input, horizonMonths: horizon(input.targetDate) }).returning();
    await tx.update(householdPlanning).set({ revision: planning.revision + 1, updatedAt: new Date() }).where(and(eq(householdPlanning.householdId, householdId), eq(householdPlanning.revision, planning.revision)));
    return out;
  });
}

export async function mutateGoal(householdId: string, id: string, input: Partial<GoalInput>, revision: number) {
  return db.transaction(async (tx) => {
    await lockHousehold(tx, householdId);
    const planning = await lockPlanning(tx, householdId);
    const [old] = await tx.select().from(planningGoals).where(and(eq(planningGoals.id, id), eq(planningGoals.householdId, householdId), eq(planningGoals.status, "active"))).for("update").limit(1);
    if (!old) throw new AppError(404, "GOAL_NOT_FOUND", "Goal not found");
    if (old.revision !== revision) throw conflict();
    const [out] = await tx.update(planningGoals).set({ ...input, ...(input.targetDate ? { horizonMonths: horizon(input.targetDate) } : {}), revision: revision + 1, updatedAt: new Date() }).where(and(eq(planningGoals.id, id), eq(planningGoals.revision, revision))).returning();
    if (!out) throw conflict();
    await tx.update(householdPlanning).set({ revision: planning.revision + 1, updatedAt: new Date() }).where(and(eq(householdPlanning.householdId, householdId), eq(householdPlanning.revision, planning.revision)));
    return out;
  });
}

export async function removeGoal(householdId: string, id: string) {
  return db.transaction(async (tx) => {
    await lockHousehold(tx, householdId);
    const planning = await lockPlanning(tx, householdId);
    const [old] = await tx.select().from(planningGoals).where(and(eq(planningGoals.id, id), eq(planningGoals.householdId, householdId), eq(planningGoals.status, "active"))).for("update").limit(1);
    if (!old) throw new AppError(404, "GOAL_NOT_FOUND", "Goal not found");
    await tx.update(planningGoals).set({ status: "archived", revision: old.revision + 1, updatedAt: new Date() }).where(and(eq(planningGoals.id, id), eq(planningGoals.revision, old.revision)));
    await tx.update(householdPlanning).set({ revision: planning.revision + 1, updatedAt: new Date() }).where(and(eq(householdPlanning.householdId, householdId), eq(householdPlanning.revision, planning.revision)));
  });
}

export async function feasibility(householdId: string) {
  const goals = await listGoals(householdId);
  const p = await getPlanning(householdId);
  const c = p.inputs.cashFlow;
  const capacity = c?.income !== undefined && c.income !== null && c.income !== ""
    ? new Decimal(c.income)
        .minus(c.essentialExpenses ?? "0")
        .minus(c.discretionaryExpenses ?? "0")
        .minus(c.emis ?? "0")
        .minus(c.mandatoryObligations ?? "0")
    : null;
  const fundingCapacity = capacity !== null ? Decimal.max(capacity, 0).toFixed(2) : undefined;
  const data = goals.map((g) => {
    const cat = (["education", "medical", "retirement", "home", "custom"].includes(g.category)
      ? g.category
      : "general") as "general" | "education" | "medical" | "retirement" | "home" | "custom";
    return {
      id: g.id,
      result: calculateGoalFunding({
        goalName: g.name,
        goalCategory: cat,
        targetAmountToday: g.targetAmount,
        currentSavings: g.currentSavings,
        horizonMonths: g.horizonMonths,
        availableMonthlyCapacity: fundingCapacity,
        expectedAnnualReturn: "0",
      }),
      monthlyContribution: g.monthlyContribution,
    };
  });
  const total = data.reduce((a, g) => a.plus(g.monthlyContribution), new Decimal(0));
  return {
    goals: data,
    availableMonthlyCapacity: capacity !== null ? capacity.toFixed(2) : null,
    combinedMonthlyContribution: total.toFixed(2),
    overAllocated: capacity !== null && total.gt(capacity),
  };
}

async function loadGenerationReplay(tx: PlanningTransaction, householdId: string, planId: string, planVersionId: string) {
  const [plan] = await tx.select().from(plans).where(and(eq(plans.id, planId), eq(plans.householdId, householdId))).limit(1);
  const [version] = await tx.select().from(planVersions).where(and(eq(planVersions.id, planVersionId), eq(planVersions.householdId, householdId))).limit(1);
  if (!plan || !version) throw new AppError(500, "GENERATION_REPLAY_CORRUPT", "Stored generation result is unavailable");
  const [snapshot] = await tx.select().from(financialSnapshots).where(and(eq(financialSnapshots.id, version.snapshotId), eq(financialSnapshots.householdId, householdId))).limit(1);
  if (!snapshot) throw new AppError(500, "GENERATION_REPLAY_CORRUPT", "Stored generation result is unavailable");
  return { plan: { ...plan, currentVersionId: version.id }, currentVersion: version, snapshot };
}

export async function generate(householdId: string, revision: number, key: string) {
  return db.transaction(async (tx) => {
    await lockHousehold(tx, householdId);
    const [replay] = await tx.select().from(planGenerationRequests).where(and(eq(planGenerationRequests.householdId, householdId), eq(planGenerationRequests.idempotencyKey, key))).limit(1);
    if (replay?.planId && replay.planVersionId) return loadGenerationReplay(tx, householdId, replay.planId, replay.planVersionId);

    const [planning] = await tx.select().from(householdPlanning).where(eq(householdPlanning.householdId, householdId)).for("update").limit(1);
    if (!planning || planning.revision !== revision) throw conflict();
    const [reservation] = await tx.insert(planGenerationRequests).values({ householdId, idempotencyKey: key, revision }).returning();
    const result = await recalculatePlanInTransaction(tx, householdId, { asOf: new Date().toISOString(), revision, inputs: planning.inputs });
    await tx.update(planGenerationRequests).set({ planId: result.plan.id, planVersionId: result.currentVersion.id }).where(eq(planGenerationRequests.id, reservation.id));
    return result;
  });
}
