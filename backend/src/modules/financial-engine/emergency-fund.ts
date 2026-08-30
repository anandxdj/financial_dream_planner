import { Decimal, formatMoney, formatRate, parseNonNegativeDecimal } from "./decimal";
import { createCompletenessResult, FINANCIAL_WARNING_CODES, type CompletenessResult } from "./completeness";
import { resolveAssumptions, type ResolvedAssumptions } from "./policy";
import { AppError } from "../../shared/errors/app-error";

export type IncomeStabilityType = "stable" | "variable" | "irregular";

export interface EmergencyFundInput {
  essentialExpenses?: string;
  emis?: string;
  mandatoryObligations?: string;
  incomeStability?: IncomeStabilityType;
  dependents?: number;
  currentReserves?: string;
  monthlyContribution?: string;
  customReserveMonths?: number;
  policyVersion?: string;
}

export interface EmergencyFundOutput {
  monthlyNeed: string | null;
  baseReserveMonths: number | null;
  dependentsUpliftMonths: number | null;
  targetReserveMonths: number | null;
  targetAmount: string | null;
  currentReserves: string | null;
  runwayMonths: string | null;
  shortfall: string | null;
  completionMonths: number | null;
  completeness: CompletenessResult;
  policyVersion: string;
  resolvedAssumptions: ResolvedAssumptions;
}

export function getDependentsUplift(dependents: number): number {
  if (dependents <= 0) return 0;
  if (dependents <= 2) return 1;
  return 2;
}

export function calculateEmergencyFund(input: EmergencyFundInput): EmergencyFundOutput {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (input.essentialExpenses === undefined || input.essentialExpenses === null) missing.push("essentialExpenses");
  if (input.emis === undefined || input.emis === null) missing.push("emis");
  if (input.mandatoryObligations === undefined || input.mandatoryObligations === null) missing.push("mandatoryObligations");
  if (input.incomeStability === undefined || input.incomeStability === null) missing.push("incomeStability");
  if (input.dependents === undefined || input.dependents === null) missing.push("dependents");
  if (input.currentReserves === undefined || input.currentReserves === null) missing.push("currentReserves");

  if (input.dependents !== undefined && input.dependents !== null) {
    if (!Number.isInteger(input.dependents) || input.dependents < 0) {
      throw new AppError(400, "INVALID_INPUT", "Dependents must be a non-negative integer");
    }
  }

  if (input.incomeStability !== undefined && input.incomeStability !== null) {
    if (!["stable", "variable", "irregular"].includes(input.incomeStability)) {
      throw new AppError(400, "INVALID_INPUT", `incomeStability must be one of: "stable", "variable", "irregular"`);
    }
  }

  if (input.customReserveMonths !== undefined &&
      (!Number.isInteger(input.customReserveMonths) || input.customReserveMonths <= 0)) {
    throw new AppError(400, "INVALID_INPUT", "customReserveMonths must be a positive integer");
  }

  const reserveOverride = input.customReserveMonths !== undefined && input.incomeStability !== undefined
    ? { [input.incomeStability]: input.customReserveMonths }
    : undefined;
  const assumptions = resolveAssumptions(input.policyVersion, { emergencyReserveMonths: reserveOverride });

  if (missing.length > 0) {
    return {
      monthlyNeed: null,
      baseReserveMonths: null,
      dependentsUpliftMonths: input.dependents !== undefined && input.dependents !== null ? getDependentsUplift(input.dependents) : null,
      targetReserveMonths: null,
      targetAmount: null,
      currentReserves: input.currentReserves !== undefined && input.currentReserves !== null ? formatMoney(parseNonNegativeDecimal(input.currentReserves, "currentReserves")) : null,
      runwayMonths: null,
      shortfall: null,
      completionMonths: null,
      completeness: createCompletenessResult(missing, warnings),
      policyVersion: assumptions.policyVersion,
      resolvedAssumptions: assumptions,
    };
  }

  const essential = parseNonNegativeDecimal(input.essentialExpenses, "essentialExpenses");
  const emis = parseNonNegativeDecimal(input.emis, "emis");
  const mandatory = parseNonNegativeDecimal(input.mandatoryObligations, "mandatoryObligations");
  const currentReserves = parseNonNegativeDecimal(input.currentReserves, "currentReserves");
  const dependents = input.dependents!;
  const stability = input.incomeStability!;

  const monthlyNeed = essential.add(emis).add(mandatory);
  const baseMonths = assumptions.emergencyReserveMonths[stability];
  const upliftMonths = getDependentsUplift(dependents);
  const targetMonths = baseMonths + upliftMonths;
  const targetAmount = monthlyNeed.mul(targetMonths);

  let runwayMonths: Decimal | null = null;
  if (monthlyNeed.isZero()) {
    warnings.push(FINANCIAL_WARNING_CODES.ZERO_EXPENSES);
  } else {
    runwayMonths = currentReserves.div(monthlyNeed);
  }

  const shortfall = Decimal.max(targetAmount.minus(currentReserves), new Decimal(0));

  let completionMonths: number | null = null;
  if (shortfall.isZero()) {
    completionMonths = 0;
    warnings.push(FINANCIAL_WARNING_CODES.TARGET_ALREADY_FUNDED);
  } else if (input.monthlyContribution !== undefined && input.monthlyContribution !== null) {
    const contribution = parseNonNegativeDecimal(input.monthlyContribution, "monthlyContribution");
    if (contribution.greaterThan(0)) {
      const monthsDecimal = shortfall.div(contribution);
      completionMonths = Math.ceil(monthsDecimal.toNumber());
    } else {
      warnings.push(FINANCIAL_WARNING_CODES.INSUFFICIENT_MONTHLY_CAPACITY);
    }
  }

  if (runwayMonths && runwayMonths.lessThan(targetMonths) && !shortfall.isZero()) {
    warnings.push(FINANCIAL_WARNING_CODES.INSUFFICIENT_RUNWAY);
  }

  return {
    monthlyNeed: formatMoney(monthlyNeed),
    baseReserveMonths: baseMonths,
    dependentsUpliftMonths: upliftMonths,
    targetReserveMonths: targetMonths,
    targetAmount: formatMoney(targetAmount),
    currentReserves: formatMoney(currentReserves),
    runwayMonths: formatRate(runwayMonths),
    shortfall: formatMoney(shortfall),
    completionMonths,
    completeness: createCompletenessResult(missing, warnings),
    policyVersion: assumptions.policyVersion,
    resolvedAssumptions: assumptions,
  };
}
