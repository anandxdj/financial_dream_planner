import Decimal from "decimal.js";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../database/client";
import { AppError } from "../../shared/errors/app-error";
import { calculateEmiValue, calculateLoan, type LoanOutput } from "../financial-engine/loan";
import { parseNonNegativeDecimal } from "../financial-engine/decimal";
import { plans, planVersions, financialSnapshots } from "../plans/model";
import { scenarios } from "../scenarios/model";
import {
  loans,
  type SelectLoan,
  type InsertLoan,
  type CreateLoanRequestSchema,
  type UpdateLoanRequestSchema,
  type PrepaymentSimulationRequestSchema,
  type CreatePrepaymentScenarioRequestSchema,
} from "./model";
import type { z } from "zod";

export function serializeLoan(loan: SelectLoan) {
  return {
    id: loan.id,
    householdId: loan.householdId,
    name: loan.name,
    type: loan.type as any,
    originalPrincipal: loan.originalPrincipal ?? null,
    outstandingPrincipal: loan.outstandingPrincipal,
    interestRate: loan.interestRate ?? null,
    remainingTenureMonths: loan.remainingTenureMonths ?? null,
    monthlyEmi: loan.monthlyEmi ?? null,
    nextDueDate: loan.nextDueDate ?? null,
    lenderName: loan.lenderName ?? null,
    accountId: loan.accountId ?? null,
    prepayments: loan.prepayments ?? [],
    status: loan.status as any,
    revision: loan.revision,
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt.toISOString(),
  };
}

export async function listLoans(householdId: string) {
  const activeLoans = await db
    .select()
    .from(loans)
    .where(and(eq(loans.householdId, householdId), eq(loans.status, "active")))
    .orderBy(desc(loans.createdAt));

  let totalPrincipal = new Decimal(0);
  let totalEmi = new Decimal(0);

  for (const l of activeLoans) {
    totalPrincipal = totalPrincipal.plus(new Decimal(l.outstandingPrincipal));
    if (l.monthlyEmi) {
      totalEmi = totalEmi.plus(new Decimal(l.monthlyEmi));
    }
  }

  return {
    loans: activeLoans,
    summary: {
      totalOutstandingPrincipal: totalPrincipal.toFixed(2),
      totalMonthlyEmi: totalEmi.toFixed(2),
      activeLoansCount: activeLoans.length,
    },
  };
}

export async function getLoanById(householdId: string, id: string): Promise<SelectLoan> {
  const [loan] = await db
    .select()
    .from(loans)
    .where(and(eq(loans.id, id), eq(loans.householdId, householdId)))
    .limit(1);

  if (!loan) {
    throw new AppError(404, "LOAN_NOT_FOUND", "Loan not found");
  }

  return loan;
}

export async function createLoan(
  householdId: string,
  input: z.infer<typeof CreateLoanRequestSchema>,
): Promise<SelectLoan> {
  let calculatedEmi = input.monthlyEmi;

  if (
    !calculatedEmi &&
    input.interestRate &&
    input.remainingTenureMonths &&
    input.remainingTenureMonths > 0
  ) {
    try {
      const p = parseNonNegativeDecimal(input.outstandingPrincipal, "outstandingPrincipal");
      const r = parseNonNegativeDecimal(input.interestRate, "interestRate");
      const emiVal = calculateEmiValue(p, r, input.remainingTenureMonths);
      calculatedEmi = emiVal.toFixed(2);
    } catch {
      // Keep calculatedEmi undefined if calculation fails
    }
  }

  const [created] = await db
    .insert(loans)
    .values({
      householdId,
      name: input.name,
      type: input.type,
      originalPrincipal: input.originalPrincipal ?? null,
      outstandingPrincipal: input.outstandingPrincipal,
      interestRate: input.interestRate ?? null,
      remainingTenureMonths: input.remainingTenureMonths ?? null,
      monthlyEmi: calculatedEmi ?? null,
      nextDueDate: input.nextDueDate ?? null,
      lenderName: input.lenderName ?? null,
      accountId: input.accountId ?? null,
      prepayments: input.prepayments ?? [],
      status: "active",
      revision: 0,
    })
    .returning();

  return created;
}

export async function updateLoan(
  householdId: string,
  id: string,
  input: z.infer<typeof UpdateLoanRequestSchema>,
  expectedRevision?: number,
): Promise<SelectLoan> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${householdId}))`);

    const [existing] = await tx
      .select()
      .from(loans)
      .where(and(eq(loans.id, id), eq(loans.householdId, householdId)))
      .for("update");

    if (!existing) {
      throw new AppError(404, "LOAN_NOT_FOUND", "Loan not found");
    }

    if (expectedRevision !== undefined && existing.revision !== expectedRevision) {
      throw new AppError(409, "REVISION_CONFLICT", "Loan revision conflict");
    }

    const outstanding = input.outstandingPrincipal ?? existing.outstandingPrincipal;
    const rate = input.interestRate !== undefined ? input.interestRate : existing.interestRate;
    const tenure =
      input.remainingTenureMonths !== undefined
        ? input.remainingTenureMonths
        : existing.remainingTenureMonths;
    let emi = input.monthlyEmi !== undefined ? input.monthlyEmi : existing.monthlyEmi;

    if (!emi && rate && tenure && tenure > 0) {
      try {
        const p = parseNonNegativeDecimal(outstanding, "outstandingPrincipal");
        const r = parseNonNegativeDecimal(rate, "interestRate");
        emi = calculateEmiValue(p, r, tenure).toFixed(2);
      } catch {
        // Keep emi as is
      }
    }

    const updates: Partial<InsertLoan> = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.originalPrincipal !== undefined ? { originalPrincipal: input.originalPrincipal } : {}),
      ...(input.outstandingPrincipal !== undefined ? { outstandingPrincipal: input.outstandingPrincipal } : {}),
      ...(input.interestRate !== undefined ? { interestRate: input.interestRate } : {}),
      ...(input.remainingTenureMonths !== undefined ? { remainingTenureMonths: input.remainingTenureMonths } : {}),
      ...(emi !== undefined ? { monthlyEmi: emi } : {}),
      ...(input.nextDueDate !== undefined ? { nextDueDate: input.nextDueDate } : {}),
      ...(input.lenderName !== undefined ? { lenderName: input.lenderName } : {}),
      ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
      ...(input.prepayments !== undefined ? { prepayments: input.prepayments } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      revision: existing.revision + 1,
      updatedAt: new Date(),
    };

    const [updated] = await tx
      .update(loans)
      .set(updates)
      .where(and(eq(loans.id, id), eq(loans.householdId, householdId)))
      .returning();

    return updated;
  });
}

export async function deleteLoan(householdId: string, id: string): Promise<void> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${householdId}))`);

    const [existing] = await tx
      .select()
      .from(loans)
      .where(and(eq(loans.id, id), eq(loans.householdId, householdId)))
      .for("update");

    if (!existing) {
      throw new AppError(404, "LOAN_NOT_FOUND", "Loan not found");
    }

    await tx
      .update(loans)
      .set({ status: "archived", revision: existing.revision + 1, updatedAt: new Date() })
      .where(and(eq(loans.id, id), eq(loans.householdId, householdId)));
  });
}

export async function analyzeLoan(householdId: string, id: string) {
  const loan = await getLoanById(householdId, id);

  const analysis: LoanOutput = calculateLoan({
    principal: loan.outstandingPrincipal,
    annualRate: loan.interestRate ?? undefined,
    tenureMonths: loan.remainingTenureMonths ?? undefined,
    prepayments: loan.prepayments,
  });

  return {
    loan: serializeLoan(loan),
    analysis,
    disclaimer:
      "This deterministic analysis is for financial planning purposes only and does not constitute a lender offer or credit decision.",
  };
}

export async function simulatePrepayment(
  householdId: string,
  id: string,
  input: z.infer<typeof PrepaymentSimulationRequestSchema>,
) {
  const loan = await getLoanById(householdId, id);

  const baselineAnalysis = calculateLoan({
    principal: loan.outstandingPrincipal,
    annualRate: loan.interestRate ?? undefined,
    tenureMonths: loan.remainingTenureMonths ?? undefined,
  });

  const revisedAnalysis = calculateLoan({
    principal: loan.outstandingPrincipal,
    annualRate: loan.interestRate ?? undefined,
    tenureMonths: loan.remainingTenureMonths ?? undefined,
    prepayments: input.prepayments,
    prepaymentStrategy: input.prepaymentStrategy,
  });

  const prepComparison = revisedAnalysis.prepaymentComparison;
  if (!prepComparison) {
    throw new AppError(400, "SIMULATION_FAILED", "Prepayment simulation could not be calculated with provided terms");
  }

  // Calculate total lump sum prepaid
  let totalLumpSum = new Decimal(0);
  for (const p of input.prepayments) {
    totalLumpSum = totalLumpSum.plus(new Decimal(p.amount));
  }

  // Monthly EMI delta
  const origEmi = new Decimal(loan.monthlyEmi ?? baselineAnalysis.monthlyEmi ?? "0");
  const revEmi = new Decimal(prepComparison.revisedMonthlyEmi);
  const emiDelta = revEmi.minus(origEmi);

  // Check liquid savings and emergency buffer impact from current plan
  const [currentPlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.householdId, householdId))
    .limit(1);

  let liquidSavings: Decimal | null = null;
  let monthlyExpenses: Decimal | null = null;

  if (currentPlan?.currentVersionId) {
    const [snapRow] = await db
      .select({ snapshot: financialSnapshots })
      .from(planVersions)
      .innerJoin(financialSnapshots, eq(financialSnapshots.id, planVersions.snapshotId))
      .where(and(eq(planVersions.id, currentPlan.currentVersionId), eq(planVersions.householdId, householdId)))
      .limit(1);

    if (snapRow?.snapshot) {
      const inputs = snapRow.snapshot.inputs;
      if (inputs.emergencyFund?.currentReserves) {
        liquidSavings = new Decimal(inputs.emergencyFund.currentReserves);
      }
      if (inputs.emergencyFund?.essentialExpenses) {
        monthlyExpenses = new Decimal(inputs.emergencyFund.essentialExpenses);
      } else if (inputs.cashFlow?.essentialExpenses) {
        monthlyExpenses = new Decimal(inputs.cashFlow.essentialExpenses);
      }
    }
  }

  let liquidSavingsRemaining: string | null = null;
  let bufferMonthsRemaining: string | null = null;
  let emergencyFundSafe: boolean | null = null;
  let goalImpactSummary = "Prepayment reduces interest burden without modifying current plan until saved as a scenario.";

  if (liquidSavings !== null) {
    const remaining = liquidSavings.minus(totalLumpSum);
    liquidSavingsRemaining = remaining.toFixed(2);
    if (monthlyExpenses !== null && monthlyExpenses.gt(0)) {
      const bufMonths = remaining.div(monthlyExpenses);
      bufferMonthsRemaining = bufMonths.toFixed(1);
      emergencyFundSafe = bufMonths.gte(3);
      if (!emergencyFundSafe) {
        goalImpactSummary = "Caution: This prepayment may reduce your liquid reserves below the recommended 3-month safety buffer.";
      } else {
        goalImpactSummary = `Safe: Your emergency reserve remains at approximately ${bufferMonthsRemaining} months of expenses.`;
      }
    }
  }

  return {
    loanId: loan.id,
    loanName: loan.name,
    prepaymentStrategy: input.prepaymentStrategy,
    original: {
      totalInterest: prepComparison.originalTotalInterest,
      tenureMonths: prepComparison.originalTenureMonths,
      monthlyEmi: loan.monthlyEmi ?? baselineAnalysis.monthlyEmi ?? "0.00",
    },
    revised: {
      totalInterest: prepComparison.revisedTotalInterest,
      tenureMonths: prepComparison.revisedTenureMonths,
      monthlyEmi: prepComparison.revisedMonthlyEmi,
      interestSaved: prepComparison.interestSaved,
      monthsSaved: prepComparison.monthsSaved,
    },
    schedule: prepComparison.schedule,
    planningImpact: {
      lumpSumPaid: totalLumpSum.toFixed(2),
      monthlyEmiDelta: emiDelta.toFixed(2),
      liquidSavingsRemaining,
      bufferMonthsRemaining,
      emergencyFundSafe,
      goalImpactSummary,
    },
    disclaimer:
      "This deterministic prepayment simulation is for planning purposes only and is not a lender agreement or quote.",
  };
}

export async function savePrepaymentScenario(
  householdId: string,
  id: string,
  input: z.infer<typeof CreatePrepaymentScenarioRequestSchema>,
) {
  const [currentPlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.householdId, householdId))
    .limit(1);

  if (!currentPlan || !currentPlan.currentVersionId) {
    throw new AppError(400, "NO_CURRENT_PLAN", "Cannot create scenario without an existing current plan");
  }

  const simulation = await simulatePrepayment(householdId, id, {
    prepayments: input.prepayments,
    prepaymentStrategy: input.prepaymentStrategy,
  });

  const [created] = await db
    .insert(scenarios)
    .values({
      householdId,
      baselineVersionId: currentPlan.currentVersionId,
      name: input.scenarioName,
      description: input.description ?? `Loan prepayment scenario for ${simulation.loanName} saving INR ${simulation.revised.interestSaved} in interest`,
      overlay: {
        loan: {
          prepayments: input.prepayments,
          prepaymentStrategy: input.prepaymentStrategy,
        },
      },
      status: "draft",
      revision: 0,
    })
    .returning();

  return created;
}
