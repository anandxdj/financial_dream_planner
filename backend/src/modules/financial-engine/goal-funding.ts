import { Decimal, formatMoney, formatRate, parseNonNegativeDecimal, parsePositiveDecimal } from "./decimal";
import { createCompletenessResult, FINANCIAL_WARNING_CODES, type CompletenessResult } from "./completeness";
import { resolveAssumptions, type ResolvedAssumptions } from "./policy";
import { AppError } from "../../shared/errors/app-error";

export type GoalCategory = "general" | "education" | "medical" | "retirement" | "home" | "custom";
export type FeasibilityStatus = "funded" | "feasible" | "infeasible" | "unconstrained";

export interface GoalFundingInput {
  goalName?: string;
  goalCategory?: GoalCategory;
  targetAmountToday?: string;
  horizonMonths?: number;
  currentSavings?: string;
  availableMonthlyCapacity?: string;
  expectedAnnualReturn?: string;
  annualInflation?: string;
  policyVersion?: string;
}

export interface GoalFundingOutput {
  goalName: string | null;
  goalCategory: GoalCategory;
  targetAmountToday: string | null;
  futureGoalCost: string | null;
  currentSavings: string | null;
  currentSavingsFutureValue: string | null;
  fundingRatio: string | null;
  shortfall: string | null;
  requiredSip: string | null;
  requiredLumpSum: string | null;
  availableMonthlyCapacity: string | null;
  feasibility: FeasibilityStatus | null;
  horizonMonths: number | null;
  annualInflationUsed: string;
  expectedReturnUsed: string;
  completeness: CompletenessResult;
  policyVersion: string;
  resolvedAssumptions: ResolvedAssumptions;
}

export function calculateGoalFunding(input: GoalFundingInput): GoalFundingOutput {
  const missing: string[] = [];
  const warnings: string[] = [];
  const category: GoalCategory = input.goalCategory ?? "general";

  const explicitInflation = input.annualInflation !== undefined && input.annualInflation !== null
    ? parseNonNegativeDecimal(input.annualInflation, "annualInflation").toString()
    : undefined;
  const explicitReturn = input.expectedAnnualReturn !== undefined && input.expectedAnnualReturn !== null
    ? parseNonNegativeDecimal(input.expectedAnnualReturn, "expectedAnnualReturn").toString()
    : undefined;
  const assumptions = resolveAssumptions(input.policyVersion, {
    generalInflation: category !== "education" && category !== "medical" ? explicitInflation : undefined,
    educationInflation: category === "education" ? explicitInflation : undefined,
    medicalInflation: category === "medical" ? explicitInflation : undefined,
    expectedReturn: explicitReturn,
  });

  if (input.targetAmountToday === undefined || input.targetAmountToday === null) missing.push("targetAmountToday");
  if (input.horizonMonths === undefined || input.horizonMonths === null) missing.push("horizonMonths");
  if (input.currentSavings === undefined || input.currentSavings === null) missing.push("currentSavings");

  if (input.horizonMonths !== undefined && input.horizonMonths !== null) {
    if (!Number.isInteger(input.horizonMonths) || input.horizonMonths <= 0) {
      throw new AppError(400, "INVALID_INPUT", "horizonMonths must be a positive integer");
    }
  }

  const inflationRate = new Decimal(
    category === "education"
      ? assumptions.educationInflation
      : category === "medical"
        ? assumptions.medicalInflation
        : assumptions.generalInflation,
  );

  const returnRate = new Decimal(assumptions.returns.expected);

  if (missing.length > 0) {
    return {
      goalName: input.goalName ?? null,
      goalCategory: category,
      targetAmountToday: input.targetAmountToday !== undefined && input.targetAmountToday !== null ? formatMoney(parsePositiveDecimal(input.targetAmountToday, "targetAmountToday")) : null,
      futureGoalCost: null,
      currentSavings: input.currentSavings !== undefined && input.currentSavings !== null ? formatMoney(parseNonNegativeDecimal(input.currentSavings, "currentSavings")) : null,
      currentSavingsFutureValue: null,
      fundingRatio: null,
      shortfall: null,
      requiredSip: null,
      requiredLumpSum: null,
      availableMonthlyCapacity: input.availableMonthlyCapacity !== undefined && input.availableMonthlyCapacity !== null ? formatMoney(parseNonNegativeDecimal(input.availableMonthlyCapacity, "availableMonthlyCapacity")) : null,
      feasibility: null,
      horizonMonths: input.horizonMonths ?? null,
      annualInflationUsed: formatRate(inflationRate)!,
      expectedReturnUsed: formatRate(returnRate)!,
      completeness: createCompletenessResult(missing, warnings),
      policyVersion: assumptions.policyVersion,
      resolvedAssumptions: assumptions,
    };
  }

  const pv = parsePositiveDecimal(input.targetAmountToday, "targetAmountToday");
  const p0 = parseNonNegativeDecimal(input.currentSavings, "currentSavings");
  const n = input.horizonMonths!;

  const rInf = inflationRate.div(new Decimal(1200));
  const rRet = returnRate.div(new Decimal(1200));

  // Future goal cost: compounds present target by annual inflation over month horizon
  const fvTarget = rInf.isZero()
    ? pv
    : pv.mul(new Decimal(1).add(rInf).pow(n));

  // Current funding future growth
  const fvCurrent = rRet.isZero()
    ? p0
    : p0.mul(new Decimal(1).add(rRet).pow(n));

  const shortfall = Decimal.max(fvTarget.minus(fvCurrent), new Decimal(0));
  const fundingRatio = fvTarget.isZero() ? new Decimal(100) : fvCurrent.div(fvTarget).mul(100);

  let requiredSip = new Decimal(0);
  let requiredLumpSum = new Decimal(0);
  let feasibility: FeasibilityStatus = "unconstrained";

  if (shortfall.isZero()) {
    warnings.push(FINANCIAL_WARNING_CODES.TARGET_ALREADY_FUNDED);
    feasibility = "funded";
  } else {
    // Required lump sum today
    requiredLumpSum = rRet.isZero()
      ? shortfall
      : shortfall.div(new Decimal(1).add(rRet).pow(n));

    // Required monthly SIP using ordinary annuity future-value formula
    if (rRet.isZero()) {
      requiredSip = shortfall.div(new Decimal(n));
    } else {
      const powTerm = new Decimal(1).add(rRet).pow(n);
      const denominator = powTerm.minus(new Decimal(1));
      requiredSip = shortfall.mul(rRet).div(denominator);
    }

    if (input.availableMonthlyCapacity !== undefined && input.availableMonthlyCapacity !== null) {
      const capacity = parseNonNegativeDecimal(input.availableMonthlyCapacity, "availableMonthlyCapacity");
      if (capacity.greaterThanOrEqualTo(requiredSip)) {
        feasibility = "feasible";
      } else {
        feasibility = "infeasible";
        warnings.push(FINANCIAL_WARNING_CODES.INSUFFICIENT_MONTHLY_CAPACITY);
      }
    }
  }

  return {
    goalName: input.goalName ?? null,
    goalCategory: category,
    targetAmountToday: formatMoney(pv),
    futureGoalCost: formatMoney(fvTarget),
    currentSavings: formatMoney(p0),
    currentSavingsFutureValue: formatMoney(fvCurrent),
    fundingRatio: formatRate(fundingRatio),
    shortfall: formatMoney(shortfall),
    requiredSip: formatMoney(requiredSip),
    requiredLumpSum: formatMoney(requiredLumpSum),
    availableMonthlyCapacity: input.availableMonthlyCapacity !== undefined && input.availableMonthlyCapacity !== null ? formatMoney(parseNonNegativeDecimal(input.availableMonthlyCapacity, "availableMonthlyCapacity")) : null,
    feasibility,
    horizonMonths: n,
    annualInflationUsed: formatRate(inflationRate)!,
    expectedReturnUsed: formatRate(returnRate)!,
    completeness: createCompletenessResult(missing, warnings),
    policyVersion: assumptions.policyVersion,
    resolvedAssumptions: assumptions,
  };
}
