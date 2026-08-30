import { Decimal, formatMoney, formatRate, parseNonNegativeDecimal, parsePositiveDecimal } from "./decimal";
import { createCompletenessResult, FINANCIAL_WARNING_CODES, type CompletenessResult } from "./completeness";
import { resolveAssumptions, type ResolvedAssumptions } from "./policy";
import { AppError } from "../../shared/errors/app-error";

export type PrepaymentStrategy = "reduce_tenure" | "reduce_emi";

export interface PrepaymentInput {
  month: number;
  amount: string;
}

export interface RefinancingInput {
  newAnnualRate: string;
  newTenureMonths?: number;
  processingFee?: string;
}

export interface LoanInput {
  principal?: string;
  annualRate?: string;
  tenureMonths?: number;
  prepayments?: PrepaymentInput[];
  prepaymentStrategy?: PrepaymentStrategy;
  refinancing?: RefinancingInput;
  policyVersion?: string;
}

export interface AmortizationRow {
  month: number;
  payment: string;
  principal: string;
  interest: string;
  remainingBalance: string;
}

export interface PrepaymentComparison {
  originalTotalInterest: string;
  revisedTotalInterest: string;
  interestSaved: string;
  originalTenureMonths: number;
  revisedTenureMonths: number;
  monthsSaved: number;
  revisedMonthlyEmi: string;
  schedule: AmortizationRow[];
}

export interface RefinancingComparison {
  currentRemainingInterest: string;
  newMonthlyEmi: string;
  newTotalInterest: string;
  processingFee: string;
  netSavings: string;
  isBeneficial: boolean;
}

export interface LoanOutput {
  monthlyEmi: string | null;
  totalPrincipal: string | null;
  totalInterest: string | null;
  totalPayment: string | null;
  tenureMonths: number | null;
  annualRate: string | null;
  monthlyRate: string | null;
  schedule: AmortizationRow[];
  prepaymentComparison: PrepaymentComparison | null;
  refinancingComparison: RefinancingComparison | null;
  completeness: CompletenessResult;
  policyVersion: string;
  resolvedAssumptions: ResolvedAssumptions;
}

export function calculateEmiValue(principal: Decimal, annualRate: Decimal, tenureMonths: number): Decimal {
  if (tenureMonths <= 0) {
    throw new AppError(400, "INVALID_LOAN_TERMS", "Tenure months must be greater than zero");
  }
  if (annualRate.isZero()) {
    return principal.div(new Decimal(tenureMonths));
  }
  const r = annualRate.div(new Decimal(1200));
  const onePlusR = new Decimal(1).add(r);
  const powFactor = onePlusR.pow(tenureMonths);
  const numerator = principal.mul(r).mul(powFactor);
  const denominator = powFactor.minus(new Decimal(1));
  return numerator.div(denominator);
}

export function generateAmortizationSchedule(
  principal: Decimal,
  annualRate: Decimal,
  tenureMonths: number,
  calculatedEmi: Decimal,
): { schedule: AmortizationRow[]; totalPrincipal: Decimal; totalInterest: Decimal; totalPayment: Decimal } {
  const schedule: AmortizationRow[] = [];
  const r = annualRate.div(new Decimal(1200));
  let balance = principal;
  let sumPrincipal = new Decimal(0);
  let sumInterest = new Decimal(0);
  let sumPayment = new Decimal(0);

  for (let m = 1; m <= tenureMonths; m++) {
    const interest = r.isZero() ? new Decimal(0) : balance.mul(r);

    let principalPaid: Decimal;
    let payment: Decimal;

    if (m === tenureMonths) {
      // Final month adjustment: clear unrounded principal exactly
      principalPaid = balance;
      payment = principalPaid.add(interest);
      balance = new Decimal(0);
    } else {
      principalPaid = calculatedEmi.minus(interest);
      if (principalPaid.greaterThan(balance)) {
        principalPaid = balance;
        payment = principalPaid.add(interest);
        balance = new Decimal(0);
      } else {
        payment = calculatedEmi;
        balance = balance.minus(principalPaid);
      }
    }

    sumPrincipal = sumPrincipal.add(principalPaid);
    sumInterest = sumInterest.add(interest);
    sumPayment = sumPayment.add(payment);

    schedule.push({
      month: m,
      payment: formatMoney(payment)!,
      principal: formatMoney(principalPaid)!,
      interest: formatMoney(interest)!,
      remainingBalance: formatMoney(balance)!,
    });

    if (balance.isZero() && m < tenureMonths) {
      break;
    }
  }

  return { schedule, totalPrincipal: sumPrincipal, totalInterest: sumInterest, totalPayment: sumPayment };
}

export function calculateLoan(input: LoanInput): LoanOutput {
  const assumptions = resolveAssumptions(input.policyVersion);
  const missing: string[] = [];
  const warnings: string[] = [];

  if (input.principal === undefined || input.principal === null) missing.push("principal");
  if (input.annualRate === undefined || input.annualRate === null) missing.push("annualRate");
  if (input.tenureMonths === undefined || input.tenureMonths === null) missing.push("tenureMonths");

  if (input.tenureMonths !== undefined && input.tenureMonths !== null) {
    if (!Number.isInteger(input.tenureMonths) || input.tenureMonths <= 0) {
      throw new AppError(400, "INVALID_LOAN_TERMS", "tenureMonths must be a positive integer");
    }
  }

  if (missing.length > 0) {
    return {
      monthlyEmi: null,
      totalPrincipal: null,
      totalInterest: null,
      totalPayment: null,
      tenureMonths: input.tenureMonths ?? null,
      annualRate: input.annualRate !== undefined && input.annualRate !== null ? formatRate(parseNonNegativeDecimal(input.annualRate, "annualRate")) : null,
      monthlyRate: null,
      schedule: [],
      prepaymentComparison: null,
      refinancingComparison: null,
      completeness: createCompletenessResult(missing, warnings),
      policyVersion: assumptions.policyVersion,
      resolvedAssumptions: assumptions,
    };
  }

  const principal = parsePositiveDecimal(input.principal, "principal");
  const annualRate = parseNonNegativeDecimal(input.annualRate, "annualRate");
  const tenureMonths = input.tenureMonths!;
  const monthlyRate = annualRate.div(new Decimal(1200));

  if (annualRate.isZero()) {
    warnings.push(FINANCIAL_WARNING_CODES.ZERO_RATE_APPLIED);
  }

  const emi = calculateEmiValue(principal, annualRate, tenureMonths);
  const { schedule, totalPrincipal, totalInterest, totalPayment } = generateAmortizationSchedule(
    principal,
    annualRate,
    tenureMonths,
    emi,
  );

  // Handle Prepayment analysis if supplied
  let prepaymentComparison: PrepaymentComparison | null = null;
  if (input.prepayments && input.prepayments.length > 0) {
    const strategy = input.prepaymentStrategy ?? "reduce_tenure";
    const prepayMap = new Map<number, Decimal>();
    for (const p of input.prepayments) {
      if (!Number.isInteger(p.month) || p.month < 1 || p.month > tenureMonths) {
        throw new AppError(400, "INVALID_INPUT", `Prepayment month ${p.month} is outside loan tenure 1-${tenureMonths}`);
      }
      const existing = prepayMap.get(p.month) ?? new Decimal(0);
      prepayMap.set(p.month, existing.add(parsePositiveDecimal(p.amount, `prepayment month ${p.month}`)));
    }

    const revisedSchedule: AmortizationRow[] = [];
    let curBalance = principal;
    let curEmi = emi;
    let revSumInterest = new Decimal(0);
    let revMonth = 0;

    while (curBalance.greaterThan(0) && revMonth < tenureMonths * 2) {
      revMonth++;
      const interest = monthlyRate.isZero() ? new Decimal(0) : curBalance.mul(monthlyRate);
      let principalPaid = curEmi.minus(interest);
      if (principalPaid.greaterThan(curBalance)) {
        principalPaid = curBalance;
      }
      curBalance = curBalance.minus(principalPaid);

      // Apply extra prepayment if any for this month
      const extra = prepayMap.get(revMonth);
      if (extra && extra.greaterThan(0)) {
        if (extra.greaterThan(curBalance)) {
          principalPaid = principalPaid.add(curBalance);
          curBalance = new Decimal(0);
        } else {
          principalPaid = principalPaid.add(extra);
          curBalance = curBalance.minus(extra);
        }
        if (strategy === "reduce_emi" && curBalance.greaterThan(0)) {
          const remainingTenure = tenureMonths - revMonth;
          if (remainingTenure > 0) {
            curEmi = calculateEmiValue(curBalance, annualRate, remainingTenure);
          }
        }
      }

      revSumInterest = revSumInterest.add(interest);
      const totalPaymentThisMonth = principalPaid.add(interest);

      revisedSchedule.push({
        month: revMonth,
        payment: formatMoney(totalPaymentThisMonth)!,
        principal: formatMoney(principalPaid)!,
        interest: formatMoney(interest)!,
        remainingBalance: formatMoney(curBalance)!,
      });
    }

    const interestSaved = Decimal.max(totalInterest.minus(revSumInterest), new Decimal(0));
    const monthsSaved = Math.max(tenureMonths - revMonth, 0);

    prepaymentComparison = {
      originalTotalInterest: formatMoney(totalInterest)!,
      revisedTotalInterest: formatMoney(revSumInterest)!,
      interestSaved: formatMoney(interestSaved)!,
      originalTenureMonths: tenureMonths,
      revisedTenureMonths: revMonth,
      monthsSaved,
      revisedMonthlyEmi: formatMoney(strategy === "reduce_emi" ? curEmi : emi)!,
      schedule: revisedSchedule,
    };
  }

  // Handle Refinancing comparison if supplied
  let refinancingComparison: RefinancingComparison | null = null;
  if (input.refinancing) {
    const newRate = parseNonNegativeDecimal(input.refinancing.newAnnualRate, "newAnnualRate");
    const newTenure = input.refinancing.newTenureMonths ?? tenureMonths;
    const fee = input.refinancing.processingFee ? parseNonNegativeDecimal(input.refinancing.processingFee, "processingFee") : new Decimal(0);

    const newEmi = calculateEmiValue(principal, newRate, newTenure);
    const newAmort = generateAmortizationSchedule(principal, newRate, newTenure, newEmi);

    const netSavings = totalInterest.minus(newAmort.totalInterest).minus(fee);
    const isBeneficial = netSavings.greaterThan(0);

    refinancingComparison = {
      currentRemainingInterest: formatMoney(totalInterest)!,
      newMonthlyEmi: formatMoney(newEmi)!,
      newTotalInterest: formatMoney(newAmort.totalInterest)!,
      processingFee: formatMoney(fee)!,
      netSavings: formatMoney(netSavings)!,
      isBeneficial,
    };
  }

  return {
    monthlyEmi: formatMoney(emi),
    totalPrincipal: formatMoney(totalPrincipal),
    totalInterest: formatMoney(totalInterest),
    totalPayment: formatMoney(totalPayment),
    tenureMonths,
    annualRate: formatRate(annualRate),
    monthlyRate: formatRate(monthlyRate.mul(100)),
    schedule,
    prepaymentComparison,
    refinancingComparison,
    completeness: createCompletenessResult(missing, warnings),
    policyVersion: assumptions.policyVersion,
    resolvedAssumptions: assumptions,
  };
}
