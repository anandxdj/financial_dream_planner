import { calculateCashFlow, type CashFlowInput, type CashFlowOutput } from "./cash-flow";
import { calculateEmergencyFund, type EmergencyFundInput, type EmergencyFundOutput } from "./emergency-fund";
import { calculateLoan, type LoanInput, type LoanOutput } from "./loan";
import { calculateInvestmentProjection, type InvestmentProjectionInput, type InvestmentProjectionOutput } from "./investment-projection";
import { calculateGoalFunding, type GoalFundingInput, type GoalFundingOutput } from "./goal-funding";
import { calculateNetWorth, type NetWorthInput, type NetWorthOutput } from "./net-worth";
import { createCompletenessResult, type CompletenessResult } from "./completeness";
import { resolveAssumptions, type ResolvedAssumptions } from "./policy";
import { Decimal, formatMoney, formatRate } from "./decimal";

export interface ScenarioDomainInputs {
  cashFlow?: CashFlowInput;
  emergencyFund?: EmergencyFundInput;
  loan?: LoanInput;
  investment?: InvestmentProjectionInput;
  goal?: GoalFundingInput;
  netWorth?: NetWorthInput;
}

export interface ScenarioEvaluationInput {
  name: string;
  description?: string;
  baseline: ScenarioDomainInputs;
  scenario: ScenarioDomainInputs;
  policyVersion?: string;
}

export interface CashFlowDelta {
  monthlyIncomeDelta: string | null;
  totalExpensesDelta: string | null;
  monthlySurplusDelta: string | null;
  savingsRateDelta: string | null;
  investableCapacityDelta: string | null;
}

export interface EmergencyFundDelta {
  monthlyNeedDelta: string | null;
  targetAmountDelta: string | null;
  runwayMonthsDelta: string | null;
  shortfallDelta: string | null;
  completionMonthsDelta: number | null;
}

export interface LoanDelta {
  monthlyEmiDelta: string | null;
  totalInterestDelta: string | null;
  totalPaymentDelta: string | null;
  tenureMonthsDelta: number | null;
}

export interface InvestmentDelta {
  expectedFutureValueDelta: string | null;
  expectedTotalInvestedDelta: string | null;
  expectedGainsDelta: string | null;
}

export interface GoalDelta {
  futureGoalCostDelta: string | null;
  shortfallDelta: string | null;
  requiredSipDelta: string | null;
  fundingRatioDelta: string | null;
  feasibilityChanged: boolean;
}

export interface NetWorthDelta {
  totalAssetsDelta: string | null;
  totalLiabilitiesDelta: string | null;
  netWorthDelta: string | null;
}

export interface ScenarioDeltas {
  cashFlow?: CashFlowDelta;
  emergencyFund?: EmergencyFundDelta;
  loan?: LoanDelta;
  investment?: InvestmentDelta;
  goal?: GoalDelta;
  netWorth?: NetWorthDelta;
}

export interface ScenarioEvaluationOutput {
  name: string;
  description: string | null;
  baseline: {
    cashFlow?: CashFlowOutput;
    emergencyFund?: EmergencyFundOutput;
    loan?: LoanOutput;
    investment?: InvestmentProjectionOutput;
    goal?: GoalFundingOutput;
    netWorth?: NetWorthOutput;
  };
  scenario: {
    cashFlow?: CashFlowOutput;
    emergencyFund?: EmergencyFundOutput;
    loan?: LoanOutput;
    investment?: InvestmentProjectionOutput;
    goal?: GoalFundingOutput;
    netWorth?: NetWorthOutput;
  };
  deltas: ScenarioDeltas;
  completeness: CompletenessResult;
  policyVersion: string;
  resolvedAssumptions: ResolvedAssumptions;
}

function computeMoneyDelta(base: string | null | undefined, scen: string | null | undefined): string | null {
  if (base === null || base === undefined || scen === null || scen === undefined) return null;
  const b = new Decimal(base);
  const s = new Decimal(scen);
  return formatMoney(s.minus(b));
}

function computeRateDelta(base: string | null | undefined, scen: string | null | undefined): string | null {
  if (base === null || base === undefined || scen === null || scen === undefined) return null;
  const b = new Decimal(base);
  const s = new Decimal(scen);
  return formatRate(s.minus(b));
}

export function evaluateScenario(input: ScenarioEvaluationInput): ScenarioEvaluationOutput {
  const assumptions = resolveAssumptions(input.policyVersion);
  const policyVersion = assumptions.policyVersion;
  const allMissing: string[] = [];
  const allWarnings: string[] = [];

  const baselineResults: ScenarioEvaluationOutput["baseline"] = {};
  const scenarioResults: ScenarioEvaluationOutput["scenario"] = {};
  const deltas: ScenarioDeltas = {};

  // 1. Cash flow
  if (input.baseline.cashFlow || input.scenario.cashFlow) {
    const baseIn = { ...input.baseline.cashFlow, policyVersion };
    const scenIn = { ...input.baseline.cashFlow, ...input.scenario.cashFlow, policyVersion };
    const baseOut = calculateCashFlow(baseIn);
    const scenOut = calculateCashFlow(scenIn);
    baselineResults.cashFlow = baseOut;
    scenarioResults.cashFlow = scenOut;
    allMissing.push(...baseOut.completeness.missing.map((m) => `baseline.cashFlow.${m}`));
    allMissing.push(...scenOut.completeness.missing.map((m) => `scenario.cashFlow.${m}`));
    allWarnings.push(...baseOut.completeness.warnings, ...scenOut.completeness.warnings);

    deltas.cashFlow = {
      monthlyIncomeDelta: computeMoneyDelta(baseOut.monthlyIncome, scenOut.monthlyIncome),
      totalExpensesDelta: computeMoneyDelta(baseOut.totalExpenses, scenOut.totalExpenses),
      monthlySurplusDelta: computeMoneyDelta(baseOut.monthlySurplus, scenOut.monthlySurplus),
      savingsRateDelta: computeRateDelta(baseOut.savingsRate, scenOut.savingsRate),
      investableCapacityDelta: computeMoneyDelta(baseOut.investableCapacity, scenOut.investableCapacity),
    };
  }

  // 2. Emergency fund
  if (input.baseline.emergencyFund || input.scenario.emergencyFund) {
    const baseIn = { ...input.baseline.emergencyFund, policyVersion };
    const scenIn = { ...input.baseline.emergencyFund, ...input.scenario.emergencyFund, policyVersion };
    const baseOut = calculateEmergencyFund(baseIn);
    const scenOut = calculateEmergencyFund(scenIn);
    baselineResults.emergencyFund = baseOut;
    scenarioResults.emergencyFund = scenOut;
    allMissing.push(...baseOut.completeness.missing.map((m) => `baseline.emergencyFund.${m}`));
    allMissing.push(...scenOut.completeness.missing.map((m) => `scenario.emergencyFund.${m}`));
    allWarnings.push(...baseOut.completeness.warnings, ...scenOut.completeness.warnings);

    deltas.emergencyFund = {
      monthlyNeedDelta: computeMoneyDelta(baseOut.monthlyNeed, scenOut.monthlyNeed),
      targetAmountDelta: computeMoneyDelta(baseOut.targetAmount, scenOut.targetAmount),
      runwayMonthsDelta: computeRateDelta(baseOut.runwayMonths, scenOut.runwayMonths),
      shortfallDelta: computeMoneyDelta(baseOut.shortfall, scenOut.shortfall),
      completionMonthsDelta: baseOut.completionMonths !== null && scenOut.completionMonths !== null
        ? scenOut.completionMonths - baseOut.completionMonths
        : null,
    };
  }

  // 3. Loan
  if (input.baseline.loan || input.scenario.loan) {
    const baseIn = { ...input.baseline.loan, policyVersion };
    const scenIn = { ...input.baseline.loan, ...input.scenario.loan, policyVersion };
    const baseOut = calculateLoan(baseIn);
    const scenOut = calculateLoan(scenIn);
    baselineResults.loan = baseOut;
    scenarioResults.loan = scenOut;
    allMissing.push(...baseOut.completeness.missing.map((m) => `baseline.loan.${m}`));
    allMissing.push(...scenOut.completeness.missing.map((m) => `scenario.loan.${m}`));
    allWarnings.push(...baseOut.completeness.warnings, ...scenOut.completeness.warnings);

    deltas.loan = {
      monthlyEmiDelta: computeMoneyDelta(baseOut.monthlyEmi, scenOut.monthlyEmi),
      totalInterestDelta: computeMoneyDelta(baseOut.totalInterest, scenOut.totalInterest),
      totalPaymentDelta: computeMoneyDelta(baseOut.totalPayment, scenOut.totalPayment),
      tenureMonthsDelta: baseOut.tenureMonths !== null && scenOut.tenureMonths !== null
        ? scenOut.tenureMonths - baseOut.tenureMonths
        : null,
    };
  }

  // 4. Investment
  if (input.baseline.investment || input.scenario.investment) {
    const baseIn = { ...input.baseline.investment, policyVersion };
    const scenIn = { ...input.baseline.investment, ...input.scenario.investment, policyVersion };
    const baseOut = calculateInvestmentProjection(baseIn);
    const scenOut = calculateInvestmentProjection(scenIn);
    baselineResults.investment = baseOut;
    scenarioResults.investment = scenOut;
    allMissing.push(...baseOut.completeness.missing.map((m) => `baseline.investment.${m}`));
    allMissing.push(...scenOut.completeness.missing.map((m) => `scenario.investment.${m}`));
    allWarnings.push(...baseOut.completeness.warnings, ...scenOut.completeness.warnings);

    const baseExp = baseOut.scenarios.expected;
    const scenExp = scenOut.scenarios.expected;

    deltas.investment = {
      expectedFutureValueDelta: computeMoneyDelta(baseExp?.futureValue, scenExp?.futureValue),
      expectedTotalInvestedDelta: computeMoneyDelta(baseExp?.totalInvested, scenExp?.totalInvested),
      expectedGainsDelta: computeMoneyDelta(baseExp?.totalGains, scenExp?.totalGains),
    };
  }

  // 5. Goal
  if (input.baseline.goal || input.scenario.goal) {
    const baseIn = { ...input.baseline.goal, policyVersion };
    const scenIn = { ...input.baseline.goal, ...input.scenario.goal, policyVersion };
    const baseOut = calculateGoalFunding(baseIn);
    const scenOut = calculateGoalFunding(scenIn);
    baselineResults.goal = baseOut;
    scenarioResults.goal = scenOut;
    allMissing.push(...baseOut.completeness.missing.map((m) => `baseline.goal.${m}`));
    allMissing.push(...scenOut.completeness.missing.map((m) => `scenario.goal.${m}`));
    allWarnings.push(...baseOut.completeness.warnings, ...scenOut.completeness.warnings);

    deltas.goal = {
      futureGoalCostDelta: computeMoneyDelta(baseOut.futureGoalCost, scenOut.futureGoalCost),
      shortfallDelta: computeMoneyDelta(baseOut.shortfall, scenOut.shortfall),
      requiredSipDelta: computeMoneyDelta(baseOut.requiredSip, scenOut.requiredSip),
      fundingRatioDelta: computeRateDelta(baseOut.fundingRatio, scenOut.fundingRatio),
      feasibilityChanged: baseOut.feasibility !== scenOut.feasibility,
    };
  }

  // 6. Net worth
  if (input.baseline.netWorth || input.scenario.netWorth) {
    const baseIn = { ...input.baseline.netWorth, policyVersion };
    const scenIn = { ...input.baseline.netWorth, ...input.scenario.netWorth, policyVersion };
    const baseOut = calculateNetWorth(baseIn);
    const scenOut = calculateNetWorth(scenIn);
    baselineResults.netWorth = baseOut;
    scenarioResults.netWorth = scenOut;
    allMissing.push(...baseOut.completeness.missing.map((m) => `baseline.netWorth.${m}`));
    allMissing.push(...scenOut.completeness.missing.map((m) => `scenario.netWorth.${m}`));
    allWarnings.push(...baseOut.completeness.warnings, ...scenOut.completeness.warnings);

    deltas.netWorth = {
      totalAssetsDelta: computeMoneyDelta(baseOut.totalAssets, scenOut.totalAssets),
      totalLiabilitiesDelta: computeMoneyDelta(baseOut.totalLiabilities, scenOut.totalLiabilities),
      netWorthDelta: computeMoneyDelta(baseOut.netWorth, scenOut.netWorth),
    };
  }

  return {
    name: input.name,
    description: input.description ?? null,
    baseline: baselineResults,
    scenario: scenarioResults,
    deltas,
    completeness: createCompletenessResult(allMissing, allWarnings),
    policyVersion: assumptions.policyVersion,
    resolvedAssumptions: assumptions,
  };
}
