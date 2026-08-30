import { Decimal, formatMoney, formatRate, parseNonNegativeDecimal } from "./decimal";
import { createCompletenessResult, FINANCIAL_WARNING_CODES, type CompletenessResult } from "./completeness";
import { resolveAssumptions, type ResolvedAssumptions } from "./policy";

export interface CashFlowInput {
  income?: string;
  essentialExpenses?: string;
  discretionaryExpenses?: string;
  emis?: string;
  mandatoryObligations?: string;
  policyVersion?: string;
}

export interface CashFlowOutput {
  monthlyIncome: string | null;
  essentialExpenses: string | null;
  discretionaryExpenses: string | null;
  emis: string | null;
  mandatoryObligations: string | null;
  totalExpenses: string | null;
  fixedObligations: string | null;
  totalOutflows: string | null;
  monthlySurplus: string | null;
  savingsRate: string | null;
  investableCapacity: string | null;
  completeness: CompletenessResult;
  policyVersion: string;
  resolvedAssumptions: ResolvedAssumptions;
}

export function calculateCashFlow(input: CashFlowInput): CashFlowOutput {
  const assumptions = resolveAssumptions(input.policyVersion);
  const missing: string[] = [];
  const warnings: string[] = [];

  if (input.income === undefined || input.income === null) missing.push("income");
  if (input.essentialExpenses === undefined || input.essentialExpenses === null) missing.push("essentialExpenses");
  if (input.discretionaryExpenses === undefined || input.discretionaryExpenses === null) missing.push("discretionaryExpenses");
  if (input.emis === undefined || input.emis === null) missing.push("emis");
  if (input.mandatoryObligations === undefined || input.mandatoryObligations === null) missing.push("mandatoryObligations");

  if (missing.length > 0) {
    return {
      monthlyIncome: input.income !== undefined && input.income !== null ? formatMoney(parseNonNegativeDecimal(input.income, "income")) : null,
      essentialExpenses: input.essentialExpenses !== undefined && input.essentialExpenses !== null ? formatMoney(parseNonNegativeDecimal(input.essentialExpenses, "essentialExpenses")) : null,
      discretionaryExpenses: input.discretionaryExpenses !== undefined && input.discretionaryExpenses !== null ? formatMoney(parseNonNegativeDecimal(input.discretionaryExpenses, "discretionaryExpenses")) : null,
      emis: input.emis !== undefined && input.emis !== null ? formatMoney(parseNonNegativeDecimal(input.emis, "emis")) : null,
      mandatoryObligations: input.mandatoryObligations !== undefined && input.mandatoryObligations !== null ? formatMoney(parseNonNegativeDecimal(input.mandatoryObligations, "mandatoryObligations")) : null,
      totalExpenses: null,
      fixedObligations: null,
      totalOutflows: null,
      monthlySurplus: null,
      savingsRate: null,
      investableCapacity: null,
      completeness: createCompletenessResult(missing, warnings),
      policyVersion: assumptions.policyVersion,
      resolvedAssumptions: assumptions,
    };
  }

  const income = parseNonNegativeDecimal(input.income, "income");
  const essential = parseNonNegativeDecimal(input.essentialExpenses, "essentialExpenses");
  const discretionary = parseNonNegativeDecimal(input.discretionaryExpenses, "discretionaryExpenses");
  const emis = parseNonNegativeDecimal(input.emis, "emis");
  const mandatory = parseNonNegativeDecimal(input.mandatoryObligations, "mandatoryObligations");

  const totalExpenses = essential.add(discretionary);
  const fixedObligations = emis.add(mandatory);
  const totalOutflows = totalExpenses.add(fixedObligations);
  const monthlySurplus = income.minus(totalOutflows);
  const investableCapacity = Decimal.max(monthlySurplus, new Decimal(0));

  let savingsRate: Decimal | null = null;
  if (income.isZero()) {
    warnings.push(FINANCIAL_WARNING_CODES.ZERO_INCOME);
  } else {
    savingsRate = monthlySurplus.div(income).mul(100);
  }

  if (monthlySurplus.isNegative()) {
    warnings.push(FINANCIAL_WARNING_CODES.NEGATIVE_CASH_FLOW);
  }

  return {
    monthlyIncome: formatMoney(income),
    essentialExpenses: formatMoney(essential),
    discretionaryExpenses: formatMoney(discretionary),
    emis: formatMoney(emis),
    mandatoryObligations: formatMoney(mandatory),
    totalExpenses: formatMoney(totalExpenses),
    fixedObligations: formatMoney(fixedObligations),
    totalOutflows: formatMoney(totalOutflows),
    monthlySurplus: formatMoney(monthlySurplus),
    savingsRate: formatRate(savingsRate),
    investableCapacity: formatMoney(investableCapacity),
    completeness: createCompletenessResult(missing, warnings),
    policyVersion: assumptions.policyVersion,
    resolvedAssumptions: assumptions,
  };
}
