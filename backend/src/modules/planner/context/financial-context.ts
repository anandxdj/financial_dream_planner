import { AppError } from "../../../shared/errors/app-error";
import { getPlanning, listGoals } from "../../planning/planning.service";
import { getCurrentPlan } from "../../plans/plans.service";
import { listLoans } from "../../loans/loans.service";
import { listAccounts } from "../../accounts/accounts.service";

export interface PlannerGoalContext {
  id: string;
  name: string;
  category: string;
  targetAmount: string;
  currentSavings: string;
  monthlyContribution: string;
  targetDate: string;
  horizonMonths: number;
}

export interface PlannerLoanContext {
  id: string;
  name: string;
  type: string;
  outstandingPrincipal: string;
  interestRate: string | null;
  remainingTenureMonths: number | null;
  monthlyEmi: string | null;
  lenderName: string | null;
}

export interface PlannerAccountContext {
  id: string;
  name: string;
  type: string;
  currentBalance: string | null;
}

export interface PlannerFinancialContext {
  hasCurrentPlan: boolean;
  goals: PlannerGoalContext[];
  loans?: PlannerLoanContext[];
  accounts?: PlannerAccountContext[];
  recordedInputs?: Record<string, any>;
  planSummary?: {
    versionNumber: number;
    asOf: string;
    engineVersion: string;
    policyVersion: string;
    completeness: {
      status: string;
      missing: string[];
      warnings: string[];
    };
    calculatedOutput: Record<string, any>;
    inputs?: Record<string, any>;
  };
}

async function loadGoalContext(householdId: string): Promise<PlannerGoalContext[]> {
  try {
    const goals = await listGoals(householdId);
    return goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      category: goal.category,
      targetAmount: String(goal.targetAmount),
      currentSavings: String(goal.currentSavings),
      monthlyContribution: String(goal.monthlyContribution),
      targetDate: goal.targetDate,
      horizonMonths: goal.horizonMonths,
    }));
  } catch {
    return [];
  }
}

async function loadLoanContext(householdId: string): Promise<PlannerLoanContext[]> {
  try {
    const result = await listLoans(householdId);
    return (result.loans ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      outstandingPrincipal: String(l.outstandingPrincipal),
      interestRate: l.interestRate ? String(l.interestRate) : null,
      remainingTenureMonths: l.remainingTenureMonths ?? null,
      monthlyEmi: l.monthlyEmi ? String(l.monthlyEmi) : null,
      lenderName: l.lenderName ?? null,
    }));
  } catch {
    return [];
  }
}

async function loadAccountContext(householdId: string): Promise<PlannerAccountContext[]> {
  try {
    const result = await listAccounts(householdId);
    return (result ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      currentBalance: a.currentBalance ? String(a.currentBalance) : null,
    }));
  } catch {
    return [];
  }
}

export async function loadFinancialContext(
  householdId: string,
  options: { requireCurrentPlan?: boolean } = {},
): Promise<PlannerFinancialContext> {
  const [currentResult, goals, loans, accounts, planningResult] = await Promise.all([
    getCurrentPlan(householdId).then(
      (plan) => ({ success: true as const, plan }),
      (err) => ({ success: false as const, error: err }),
    ),
    loadGoalContext(householdId),
    loadLoanContext(householdId),
    loadAccountContext(householdId),
    getPlanning(householdId).catch(() => null),
  ]);

  if (currentResult.success) {
    const current = currentResult.plan;
    return {
      hasCurrentPlan: true,
      goals,
      loans,
      accounts,
      recordedInputs: planningResult?.inputs as Record<string, any> | undefined,
      planSummary: {
        versionNumber: current.currentVersion.versionNumber,
        asOf: current.snapshot.asOf.toISOString(),
        engineVersion: current.snapshot.engineVersion,
        policyVersion: current.snapshot.policyVersion,
        completeness: current.snapshot.completeness,
        calculatedOutput: current.snapshot.calculatedOutput as Record<string, any>,
        inputs: current.snapshot.inputs as Record<string, any> | undefined,
      },
    };
  }

  const error = currentResult.error;
  if (error instanceof AppError && error.statusCode !== 404) {
    throw error;
  }
  if (options.requireCurrentPlan) {
    throw new AppError(
      400,
      "MISSING_CURRENT_PLAN",
      "No active plan found for household to analyze",
    );
  }

  return {
    hasCurrentPlan: false,
    goals,
    loans,
    accounts,
    recordedInputs: planningResult?.inputs as Record<string, any> | undefined,
  };
}

export function buildFinancialContextBlock(financialContext?: PlannerFinancialContext): string {
  if (!financialContext) {
    return "No financial context is available for this household.";
  }

  const lines: string[] = [];

  if (financialContext.hasCurrentPlan && financialContext.planSummary) {
    const { versionNumber, asOf, policyVersion, completeness, calculatedOutput, inputs } = financialContext.planSummary;
    lines.push(
      `Plan version: ${versionNumber} | Plan as of: ${asOf} | Policy: ${policyVersion}`,
      `Data completeness: ${completeness.status}`,
    );

    if (completeness.missing.length > 0) {
      lines.push(`⚠ Missing fields: ${completeness.missing.join(", ")}`);
    }
    if (completeness.warnings.length > 0) {
      lines.push(`⚠ Warnings: ${completeness.warnings.join(", ")}`);
    }

    const cashFlow = calculatedOutput?.cashFlow;
    if (cashFlow) {
      lines.push("\n--- Monthly Cash Flow (pre-computed, authoritative) ---");
      lines.push(`  Monthly Income:               ${cashFlow.monthlyIncome ?? "N/A"}`);
      lines.push(`  Essential Expenses:           ${cashFlow.essentialExpenses ?? "N/A"}`);
      lines.push(`  Discretionary Expenses:       ${cashFlow.discretionaryExpenses ?? "N/A"}`);
      lines.push(`  Loan EMIs:                    ${cashFlow.emis ?? "N/A"}`);
      lines.push(`  Mandatory Obligations:        ${cashFlow.mandatoryObligations ?? "N/A"}`);
      lines.push(`  Total Monthly Outflows:       ${cashFlow.totalOutflows ?? "N/A"}`);
      lines.push(`  Monthly Net Surplus/Deficit:  ${cashFlow.monthlySurplus ?? "N/A"}`);
      lines.push(`  Savings Rate:                 ${cashFlow.savingsRate ?? "N/A"}`);
      lines.push(`  Investable Capacity:          ${cashFlow.investableCapacity ?? "N/A"}`);
    }

    const emergencyFund = calculatedOutput?.emergencyFund;
    if (emergencyFund) {
      lines.push("\n--- Emergency Fund (authoritative) ---");
      lines.push(`  Monthly Need:                 ${emergencyFund.monthlyNeed ?? "N/A"}`);
      lines.push(`  Target Amount:                ${emergencyFund.targetAmount ?? "N/A"}`);
      if (emergencyFund.targetMonths) {
        lines.push(`  Target Runway (Months):       ${emergencyFund.targetMonths}`);
      }
      lines.push(`  Current Reserves:             ${emergencyFund.currentReserves ?? "N/A"}`);
      if (emergencyFund.runwayMonths) {
        lines.push(`  Current Runway (Months):      ${emergencyFund.runwayMonths}`);
      }
      lines.push(`  Shortfall:                    ${emergencyFund.shortfall ?? "N/A"}`);
      lines.push(`  Months to Complete:           ${emergencyFund.completionMonths ?? "N/A"}`);
      if (emergencyFund.status) {
        lines.push(`  Reserve Status:               ${emergencyFund.status}`);
      }
      if (inputs?.emergencyFund?.dependents !== undefined) {
        lines.push(`  Dependents:                   ${inputs.emergencyFund.dependents}`);
      }
    }

    const netWorth = calculatedOutput?.netWorth;
    if (netWorth) {
      lines.push("\n--- Net Worth & Balance Sheet ---");
      lines.push(`  Total Assets:                 ${netWorth.totalAssets ?? "N/A"}`);
      lines.push(`  Total Liabilities:            ${netWorth.totalLiabilities ?? "N/A"}`);
      lines.push(`  Net Worth:                    ${netWorth.netWorth ?? "N/A"}`);
      if (Array.isArray(netWorth.assetAllocations) && netWorth.assetAllocations.length > 0) {
        lines.push("  Asset Allocations:");
        for (const alloc of netWorth.assetAllocations) {
          lines.push(`    - ${alloc.category}: ₹${alloc.totalValue} (${alloc.percentage}%)`);
        }
      }
      if (Array.isArray(netWorth.liabilityBreakdown) && netWorth.liabilityBreakdown.length > 0) {
        lines.push("  Liability Breakdown:");
        for (const liab of netWorth.liabilityBreakdown) {
          lines.push(`    - ${liab.category}: ₹${liab.totalValue} (${liab.percentage}%)`);
        }
      }
    }

    const loan = calculatedOutput?.loan;
    if (loan) {
      lines.push("\n--- Plan Loan Aggregate ---");
      if (loan.principal) lines.push(`  Principal:                    ${loan.principal}`);
      if (loan.annualRate) lines.push(`  Interest Rate:                ${loan.annualRate}%`);
      if (loan.tenureMonths) lines.push(`  Tenure:                       ${loan.tenureMonths} months`);
      lines.push(`  Monthly EMI:                  ${loan.monthlyEmi ?? "N/A"}`);
      lines.push(`  Total Interest:               ${loan.totalInterest ?? "N/A"}`);
      lines.push(`  Total Payment:                ${loan.totalPayment ?? "N/A"}`);
    }

    const investment = calculatedOutput?.investment;
    if (investment) {
      lines.push("\n--- Investment Projection ---");
      if (investment.monthlySip) lines.push(`  Monthly SIP:                  ${investment.monthlySip}`);
      if (investment.initialLumpSum) lines.push(`  Initial Lump Sum:             ${investment.initialLumpSum}`);
      if (investment.horizonMonths) lines.push(`  Horizon:                      ${investment.horizonMonths} months`);
      if (investment.annualStepUp) lines.push(`  Annual Step-Up:               ${investment.annualStepUp}%`);
      const expected = investment.scenarios?.expected;
      if (expected) {
        lines.push(`  Expected Future Value:        ${expected.futureValue ?? "N/A"}`);
        lines.push(`  Expected Total Invested:      ${expected.totalInvested ?? "N/A"}`);
        lines.push(`  Expected Total Gains:         ${expected.totalGains ?? "N/A"}`);
      }
    }

    const goal = calculatedOutput?.goal;
    if (goal) {
      lines.push("\n--- Plan Goal Calculation ---");
      if (goal.goalName) lines.push(`  Goal Name:                    ${goal.goalName}`);
      if (goal.targetAmountToday) lines.push(`  Target Amount Today:          ${goal.targetAmountToday}`);
      if (goal.futureGoalCost) lines.push(`  Future Goal Cost:             ${goal.futureGoalCost}`);
      if (goal.requiredSip) lines.push(`  Required Monthly SIP:         ${goal.requiredSip}`);
      if (goal.fundingRatio) lines.push(`  Funding Ratio:                ${goal.fundingRatio}%`);
      if (goal.feasibility) lines.push(`  Feasibility:                  ${goal.feasibility}`);
    }
  } else if (financialContext.recordedInputs && Object.keys(financialContext.recordedInputs).length > 0) {
    lines.push("No finalized financial plan has been generated yet for this household.");
    lines.push("However, the user has entered the following recorded planning inputs:");

    const cf = financialContext.recordedInputs.cashFlow;
    if (cf) {
      lines.push("\n--- Recorded Monthly Cash Flow Inputs ---");
      if (cf.income) lines.push(`  Monthly Income:               ${cf.income}`);
      if (cf.essentialExpenses) lines.push(`  Essential Expenses:           ${cf.essentialExpenses}`);
      if (cf.discretionaryExpenses) lines.push(`  Discretionary Expenses:       ${cf.discretionaryExpenses}`);
      if (cf.emis) lines.push(`  Loan EMIs:                    ${cf.emis}`);
      if (cf.mandatoryObligations) lines.push(`  Mandatory Obligations:        ${cf.mandatoryObligations}`);
    }

    const ef = financialContext.recordedInputs.emergencyFund;
    if (ef) {
      lines.push("\n--- Recorded Emergency Fund Inputs ---");
      if (ef.currentReserves) lines.push(`  Current Reserves:             ${ef.currentReserves}`);
      if (ef.dependents !== undefined) lines.push(`  Dependents:                   ${ef.dependents}`);
      if (ef.incomeStability) lines.push(`  Income Stability:             ${ef.incomeStability}`);
    }

    const inv = financialContext.recordedInputs.investment;
    if (inv) {
      lines.push("\n--- Recorded Investment Inputs ---");
      if (inv.monthlySip) lines.push(`  Monthly SIP:                  ${inv.monthlySip}`);
      if (inv.initialLumpSum) lines.push(`  Initial Lump Sum:             ${inv.initialLumpSum}`);
      if (inv.horizonMonths) lines.push(`  Horizon:                      ${inv.horizonMonths} months`);
    }
  } else {
    lines.push("No active financial plan or recorded planning inputs found for this household.");
  }

  if (financialContext.loans && financialContext.loans.length > 0) {
    lines.push("\n--- Active Household Loans ---");
    for (const loan of financialContext.loans) {
      const parts = [
        `  - ${loan.name} [${loan.type}]:`,
        `Outstanding ₹${loan.outstandingPrincipal}`,
      ];
      if (loan.monthlyEmi) parts.push(`EMI ₹${loan.monthlyEmi}`);
      if (loan.interestRate) parts.push(`Rate ${loan.interestRate}%`);
      if (loan.remainingTenureMonths) parts.push(`Remaining ${loan.remainingTenureMonths} mos`);
      if (loan.lenderName) parts.push(`Lender: ${loan.lenderName}`);
      lines.push(parts.join(" | "));
    }
  }

  if (financialContext.accounts && financialContext.accounts.length > 0) {
    lines.push("\n--- Recorded Accounts & Reserves ---");
    for (const acct of financialContext.accounts) {
      lines.push(`  - ${acct.name} (${acct.type}): Balance ${acct.currentBalance ? "₹" + acct.currentBalance : "N/A"}`);
    }
  }

  if (financialContext.goals.length > 0) {
    lines.push("\n--- Active Goals (user-recorded context) ---");
    for (const goal of financialContext.goals) {
      lines.push(
        `  - ${goal.name} [${goal.category}]: target ₹${goal.targetAmount}, saved ₹${goal.currentSavings}, monthly contribution ₹${goal.monthlyContribution}, target date ${goal.targetDate} (${goal.horizonMonths} mos)`,
      );
    }
  } else {
    lines.push("\nActive goals: none recorded.");
  }

  return lines.join("\n");
}
