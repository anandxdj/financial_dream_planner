import Decimal from "decimal.js";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../database/client";
import { AppError } from "../../shared/errors/app-error";
import { calculateInvestmentProjection } from "../financial-engine/investment-projection";
import { accounts } from "../accounts/model";
import { householdPlanning, planningGoals } from "../planning/model";
import { plans, planVersions, financialSnapshots } from "../plans/model";
import type {
  UpdateInvestmentInputsRequestSchema,
  SimulateInvestmentRequestSchema,
} from "./model";
import type { z } from "zod";

export async function getInvestmentSummary(householdId: string) {
  // 1. Load household planning
  const [planning] = await db
    .select()
    .from(householdPlanning)
    .where(eq(householdPlanning.householdId, householdId))
    .limit(1);

  // 2. Fallback to current plan snapshot if planning inputs are empty
  let investmentInputs = planning?.inputs?.investment;
  if (!investmentInputs) {
    const [currentPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.householdId, householdId))
      .limit(1);

    if (currentPlan?.currentVersionId) {
      const [snapRow] = await db
        .select({ snapshot: financialSnapshots })
        .from(planVersions)
        .innerJoin(financialSnapshots, eq(financialSnapshots.id, planVersions.snapshotId))
        .where(and(eq(planVersions.id, currentPlan.currentVersionId), eq(planVersions.householdId, householdId)))
        .limit(1);

      if (snapRow?.snapshot?.inputs?.investment) {
        investmentInputs = snapRow.snapshot.inputs.investment;
      }
    }
  }

  const initialLumpSum = investmentInputs?.initialLumpSum ?? null;
  const monthlySip = investmentInputs?.monthlySip ?? null;
  const annualStepUp = investmentInputs?.annualStepUp ?? null;
  const horizonMonths = investmentInputs?.horizonMonths ?? null;
  const customAnnualRate = investmentInputs?.customAnnualRate ?? null;
  const revision = planning?.revision ?? 0;

  // 3. Compute deterministic projection using financial engine
  const projection = calculateInvestmentProjection({
    initialLumpSum: initialLumpSum ?? undefined,
    monthlySip: monthlySip ?? undefined,
    annualStepUp: annualStepUp ?? undefined,
    horizonMonths: horizonMonths ?? undefined,
    customAnnualRate: customAnnualRate ?? undefined,
  });

  // 4. Fetch investment accounts (BROKERAGE, or accounts holding investments)
  const investmentAccounts = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.householdId, householdId), inArray(accounts.type, ["BROKERAGE", "OTHER"])))
    .orderBy(desc(accounts.createdAt));

  let trackedSum = new Decimal(0);
  let hasTrackedBalance = false;
  const accountViews = investmentAccounts.map((acc) => {
    if (acc.currentBalance !== null) {
      trackedSum = trackedSum.plus(new Decimal(acc.currentBalance));
      hasTrackedBalance = true;
    }
    return {
      id: acc.id,
      name: acc.name,
      institutionName: acc.institutionName,
      currentBalance: acc.currentBalance ?? null,
      balanceUpdatedAt: acc.balanceUpdatedAt ? acc.balanceUpdatedAt.toISOString() : null,
    };
  });

  // 5. Fetch linked goals from planning goals
  const activeGoals = await db
    .select()
    .from(planningGoals)
    .where(and(eq(planningGoals.householdId, householdId), eq(planningGoals.status, "active")))
    .orderBy(desc(planningGoals.createdAt));

  let goalCommitment = new Decimal(0);
  const linkedGoals = activeGoals.map((g) => {
    goalCommitment = goalCommitment.plus(new Decimal(g.monthlyContribution));
    return {
      id: g.id,
      name: g.name,
      category: g.category,
      targetAmount: g.targetAmount,
      currentSavings: g.currentSavings,
      monthlyContribution: g.monthlyContribution,
      targetDate: g.targetDate,
      horizonMonths: g.horizonMonths,
    };
  });

  // 6. Explicit unavailable values
  const unavailableValues: Array<{ field: string; status: "unavailable"; reason: string }> = [];
  if (!initialLumpSum) {
    unavailableValues.push({
      field: "initialLumpSum",
      status: "unavailable",
      reason: "Initial investment lump sum has not been provided in planning inputs",
    });
  }
  if (!monthlySip) {
    unavailableValues.push({
      field: "monthlySip",
      status: "unavailable",
      reason: "Monthly SIP contribution has not been specified",
    });
  }
  if (!horizonMonths) {
    unavailableValues.push({
      field: "horizonMonths",
      status: "unavailable",
      reason: "Investment horizon months not configured; default policy horizon is used",
    });
  }
  if (accountViews.length === 0) {
    unavailableValues.push({
      field: "accounts",
      status: "unavailable",
      reason: "No brokerage or investment accounts linked to this household",
    });
  }

  return {
    inputs: {
      initialLumpSum,
      monthlySip,
      annualStepUp,
      horizonMonths,
      customAnnualRate,
      revision,
    },
    projection,
    scenarioRanges: {
      conservative: projection.scenarios.conservative?.annualRate ?? "6.00%",
      expected: projection.scenarios.expected?.annualRate ?? "9.00%",
      optimistic: projection.scenarios.optimistic?.annualRate ?? "12.00%",
      custom: projection.scenarios.custom?.annualRate ?? null,
      explanation:
        "Standard scenarios represent Conservative (fixed-income heavy, 6%), Expected (balanced index, 9%), and Optimistic (growth equity, 12%).",
    },
    accounts: accountViews,
    totalTrackedBalance: hasTrackedBalance ? trackedSum.toFixed(2) : null,
    assetAllocation: {
      isConfigured: false,
      allocations: [],
      note: "Asset allocation breakdown is not configured; no holdings or order books are invented.",
    },
    linkedGoals,
    totalMonthlyGoalCommitment: goalCommitment.toFixed(2),
    unavailableValues,
    disclaimer:
      "Investment views and projections are deterministic planning estimates. No execution, trade placement, or portfolio custody is supported.",
  };
}

export async function updateInvestmentInputs(
  householdId: string,
  userId: string,
  input: z.infer<typeof UpdateInvestmentInputsRequestSchema>,
) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${householdId}))`);

    let [planning] = await tx
      .select()
      .from(householdPlanning)
      .where(eq(householdPlanning.householdId, householdId))
      .for("update")
      .limit(1);

    if (!planning) {
      const [newPlanning] = await tx
        .insert(householdPlanning)
        .values({
          householdId,
          inputs: {},
          completedStep: 0,
          estimates: [],
          revision: 0,
          updatedBy: userId,
        })
        .returning();
      planning = newPlanning;
    }

    if (planning.revision !== input.expectedRevision) {
      throw new AppError(409, "REVISION_CONFLICT", "Planning revision conflict; please refresh and retry");
    }

    const currentInputs = planning.inputs ?? {};
    const currentInvestment = currentInputs.investment ?? {};

    const updatedInvestment = {
      ...currentInvestment,
      ...(input.initialLumpSum !== undefined ? { initialLumpSum: input.initialLumpSum ?? undefined } : {}),
      ...(input.monthlySip !== undefined ? { monthlySip: input.monthlySip ?? undefined } : {}),
      ...(input.annualStepUp !== undefined ? { annualStepUp: input.annualStepUp ?? undefined } : {}),
      ...(input.horizonMonths !== undefined ? { horizonMonths: input.horizonMonths ?? undefined } : {}),
      ...(input.customAnnualRate !== undefined ? { customAnnualRate: input.customAnnualRate ?? undefined } : {}),
    };

    const nextRevision = planning.revision + 1;

    await tx
      .update(householdPlanning)
      .set({
        inputs: {
          ...currentInputs,
          investment: updatedInvestment,
        },
        revision: nextRevision,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(householdPlanning.householdId, householdId), eq(householdPlanning.revision, planning.revision)));

    return getInvestmentSummary(householdId);
  });
}

export function simulateInvestment(input: z.infer<typeof SimulateInvestmentRequestSchema>) {
  return calculateInvestmentProjection({
    initialLumpSum: input.initialLumpSum,
    monthlySip: input.monthlySip,
    annualStepUp: input.annualStepUp,
    horizonMonths: input.horizonMonths,
    customAnnualRate: input.customAnnualRate,
    policyVersion: input.policyVersion,
  });
}
