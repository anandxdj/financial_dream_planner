import { Decimal, formatMoney, formatRate, parseNonNegativeDecimal } from "./decimal";
import { createCompletenessResult, type CompletenessResult } from "./completeness";
import { resolveAssumptions, type ResolvedAssumptions } from "./policy";
import { AppError } from "../../shared/errors/app-error";

export interface ProjectionMilestone {
  month: number;
  year: number;
  totalInvested: string;
  futureValue: string;
  totalGains: string;
}

export interface ScenarioProjectionResult {
  scenarioName: "conservative" | "expected" | "optimistic" | "custom";
  annualRate: string;
  totalInvested: string;
  futureValue: string;
  totalGains: string;
  milestones: ProjectionMilestone[];
}

export interface InvestmentProjectionInput {
  initialLumpSum?: string;
  monthlySip?: string;
  annualStepUp?: string;
  horizonMonths?: number;
  customAnnualRate?: string;
  policyVersion?: string;
}

export interface InvestmentProjectionOutput {
  initialLumpSum: string | null;
  monthlySip: string | null;
  annualStepUp: string | null;
  horizonMonths: number | null;
  scenarios: Record<string, ScenarioProjectionResult>;
  completeness: CompletenessResult;
  policyVersion: string;
  resolvedAssumptions: ResolvedAssumptions;
}

function runProjectionForRate(
  name: "conservative" | "expected" | "optimistic" | "custom",
  annualRate: Decimal,
  lumpSum: Decimal,
  sip: Decimal,
  stepUpRate: Decimal,
  horizonMonths: number,
): ScenarioProjectionResult {
  const r = annualRate.div(new Decimal(1200));
  const s = stepUpRate.div(new Decimal(100));

  let balance = lumpSum;
  let totalInvested = lumpSum;
  const milestones: ProjectionMilestone[] = [];

  for (let m = 1; m <= horizonMonths; m++) {
    const yearIndex = Math.floor((m - 1) / 12);
    // Step-up applies once after each completed 12-month block
    const currentSip = s.isZero()
      ? sip
      : sip.mul(new Decimal(1).add(s).pow(yearIndex));

    const growth = r.isZero() ? new Decimal(0) : balance.mul(r);
    balance = balance.add(growth).add(currentSip);
    totalInvested = totalInvested.add(currentSip);

    if (m % 12 === 0 || m === horizonMonths) {
      milestones.push({
        month: m,
        year: Math.floor(m / 12) + (m % 12 === 0 ? 0 : 1),
        totalInvested: formatMoney(totalInvested)!,
        futureValue: formatMoney(balance)!,
        totalGains: formatMoney(balance.minus(totalInvested))!,
      });
    }
  }

  const totalGains = balance.minus(totalInvested);

  return {
    scenarioName: name,
    annualRate: formatRate(annualRate)!,
    totalInvested: formatMoney(totalInvested)!,
    futureValue: formatMoney(balance)!,
    totalGains: formatMoney(totalGains)!,
    milestones,
  };
}

export function calculateInvestmentProjection(input: InvestmentProjectionInput): InvestmentProjectionOutput {
  const explicitStepUp = input.annualStepUp !== undefined && input.annualStepUp !== null
    ? parseNonNegativeDecimal(input.annualStepUp, "annualStepUp")
    : null;
  const assumptions = resolveAssumptions(input.policyVersion, {
    annualStepUp: explicitStepUp?.toString(),
  });
  const missing: string[] = [];
  const warnings: string[] = [];

  if (input.horizonMonths === undefined || input.horizonMonths === null) missing.push("horizonMonths");
  if ((input.initialLumpSum === undefined || input.initialLumpSum === null) &&
      (input.monthlySip === undefined || input.monthlySip === null)) {
    missing.push("initialLumpSum");
    missing.push("monthlySip");
  }

  if (input.horizonMonths !== undefined && input.horizonMonths !== null) {
    if (!Number.isInteger(input.horizonMonths) || input.horizonMonths <= 0) {
      throw new AppError(400, "INVALID_INPUT", "horizonMonths must be a positive integer");
    }
  }

  if (missing.length > 0) {
    return {
      initialLumpSum: input.initialLumpSum !== undefined && input.initialLumpSum !== null ? formatMoney(parseNonNegativeDecimal(input.initialLumpSum, "initialLumpSum")) : null,
      monthlySip: input.monthlySip !== undefined && input.monthlySip !== null ? formatMoney(parseNonNegativeDecimal(input.monthlySip, "monthlySip")) : null,
      annualStepUp: input.annualStepUp !== undefined && input.annualStepUp !== null ? formatRate(parseNonNegativeDecimal(input.annualStepUp, "annualStepUp")) : null,
      horizonMonths: input.horizonMonths ?? null,
      scenarios: {},
      completeness: createCompletenessResult(missing, warnings),
      policyVersion: assumptions.policyVersion,
      resolvedAssumptions: assumptions,
    };
  }

  const lumpSum = input.initialLumpSum !== undefined && input.initialLumpSum !== null
    ? parseNonNegativeDecimal(input.initialLumpSum, "initialLumpSum")
    : new Decimal(0);
  const sip = input.monthlySip !== undefined && input.monthlySip !== null
    ? parseNonNegativeDecimal(input.monthlySip, "monthlySip")
    : new Decimal(0);
  const stepUp = new Decimal(assumptions.annualStepUp);

  const horizon = input.horizonMonths!;

  const conservativeRate = new Decimal(assumptions.returns.conservative);
  const expectedRate = new Decimal(assumptions.returns.expected);
  const optimisticRate = new Decimal(assumptions.returns.optimistic);

  const scenarios: Record<string, ScenarioProjectionResult> = {
    conservative: runProjectionForRate("conservative", conservativeRate, lumpSum, sip, stepUp, horizon),
    expected: runProjectionForRate("expected", expectedRate, lumpSum, sip, stepUp, horizon),
    optimistic: runProjectionForRate("optimistic", optimisticRate, lumpSum, sip, stepUp, horizon),
  };

  if (input.customAnnualRate !== undefined && input.customAnnualRate !== null) {
    const customRate = parseNonNegativeDecimal(input.customAnnualRate, "customAnnualRate");
    scenarios.custom = runProjectionForRate("custom", customRate, lumpSum, sip, stepUp, horizon);
  }

  return {
    initialLumpSum: formatMoney(lumpSum),
    monthlySip: formatMoney(sip),
    annualStepUp: formatRate(stepUp),
    horizonMonths: horizon,
    scenarios,
    completeness: createCompletenessResult(missing, warnings),
    policyVersion: assumptions.policyVersion,
    resolvedAssumptions: assumptions,
  };
}
