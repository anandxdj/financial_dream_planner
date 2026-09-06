import { AppError } from "../../../shared/errors/app-error";
import { listGoals } from "../../planning/planning.service";
import { getCurrentPlan } from "../../plans/plans.service";

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

export interface PlannerFinancialContext {
  hasCurrentPlan: boolean;
  goals: PlannerGoalContext[];
  planSummary?: {
    asOf: string;
    policyVersion: string;
    completeness: {
      status: string;
      missing: string[];
      warnings: string[];
    };
    calculatedOutput: Record<string, any>;
  };
}

async function loadGoalContext(householdId: string): Promise<PlannerGoalContext[]> {
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
}

export async function loadFinancialContext(
  householdId: string,
  options: { requireCurrentPlan?: boolean } = {},
): Promise<PlannerFinancialContext> {
  const goalsPromise = loadGoalContext(householdId);

  try {
    const [current, goals] = await Promise.all([getCurrentPlan(householdId), goalsPromise]);
    return {
      hasCurrentPlan: true,
      goals,
      planSummary: {
        asOf: current.snapshot.asOf.toISOString(),
        policyVersion: current.snapshot.policyVersion,
        completeness: current.snapshot.completeness,
        calculatedOutput: current.snapshot.calculatedOutput as Record<string, any>,
      },
    };
  } catch (error) {
    if (error instanceof AppError && error.statusCode !== 404) throw error;
    if (options.requireCurrentPlan) {
      throw new AppError(
        400,
        "MISSING_CURRENT_PLAN",
        "No active plan found for household to analyze",
      );
    }
    return {
      hasCurrentPlan: false,
      goals: await goalsPromise,
    };
  }
}

export function buildFinancialContextBlock(financialContext?: PlannerFinancialContext): string {
  if (!financialContext) {
    return "No financial context is available for this household.";
  }

  const lines: string[] = [];

  if (!financialContext.hasCurrentPlan || !financialContext.planSummary) {
    lines.push("No active financial plan found for this household.");
  } else {
    const { asOf, policyVersion, completeness, calculatedOutput } = financialContext.planSummary;
    lines.push(
      `Plan as of: ${asOf} | Policy: ${policyVersion}`,
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
      lines.push("\n--- Emergency Fund ---");
      lines.push(`  Monthly Need:        ${emergencyFund.monthlyNeed ?? "N/A"}`);
      lines.push(`  Target Amount:       ${emergencyFund.targetAmount ?? "N/A"}`);
      lines.push(`  Current Reserves:    ${emergencyFund.currentReserves ?? "N/A"}`);
      lines.push(`  Shortfall:           ${emergencyFund.shortfall ?? "N/A"}`);
      lines.push(`  Months to Complete:  ${emergencyFund.completionMonths ?? "N/A"}`);
    }

    const netWorth = calculatedOutput?.netWorth;
    if (netWorth) {
      lines.push("\n--- Net Worth ---");
      lines.push(`  Total Assets:       ${netWorth.totalAssets ?? "N/A"}`);
      lines.push(`  Total Liabilities:  ${netWorth.totalLiabilities ?? "N/A"}`);
      lines.push(`  Net Worth:          ${netWorth.netWorth ?? "N/A"}`);
    }

    const loan = calculatedOutput?.loan;
    if (loan) {
      lines.push("\n--- Loan ---");
      lines.push(`  Monthly EMI:    ${loan.monthlyEmi ?? "N/A"}`);
      lines.push(`  Total Interest: ${loan.totalInterest ?? "N/A"}`);
      lines.push(`  Total Payment:  ${loan.totalPayment ?? "N/A"}`);
    }

    const investment = calculatedOutput?.investment;
    if (investment) {
      lines.push("\n--- Investment Projection ---");
      const expected = investment.scenarios?.expected;
      if (expected) {
        lines.push(`  Expected Future Value: ${expected.futureValue ?? "N/A"}`);
        lines.push(`  Total Invested:        ${expected.totalInvested ?? "N/A"}`);
        lines.push(`  Total Gains:           ${expected.totalGains ?? "N/A"}`);
      }
    }
  }

  if (financialContext.goals.length > 0) {
    lines.push("\n--- Active Goals (user-recorded context) ---");
    for (const goal of financialContext.goals) {
      lines.push(
        `  ${goal.name} [${goal.category}]: target ${goal.targetAmount}, saved ${goal.currentSavings}, monthly contribution ${goal.monthlyContribution}, target date ${goal.targetDate}`,
      );
    }
  } else {
    lines.push("\nActive goals: none recorded.");
  }

  return lines.join("\n");
}
