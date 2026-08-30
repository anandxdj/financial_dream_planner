export type CompletenessStatus = "complete" | "incomplete";

export interface CompletenessResult {
  status: CompletenessStatus;
  missing: string[];
  warnings: string[];
}

export const FINANCIAL_WARNING_CODES = {
  NEGATIVE_CASH_FLOW: "NEGATIVE_CASH_FLOW",
  ZERO_INCOME: "ZERO_INCOME",
  TARGET_ALREADY_FUNDED: "TARGET_ALREADY_FUNDED",
  INSUFFICIENT_MONTHLY_CAPACITY: "INSUFFICIENT_MONTHLY_CAPACITY",
  NON_AMORTIZING_LOAN: "NON_AMORTIZING_LOAN",
  INVALID_LOAN_TERMS: "INVALID_LOAN_TERMS",
  ZERO_RATE_APPLIED: "ZERO_RATE_APPLIED",
  HIGH_DEBT_BURDEN: "HIGH_DEBT_BURDEN",
  INSUFFICIENT_RUNWAY: "INSUFFICIENT_RUNWAY",
  UNFEASIBLE_GOAL: "UNFEASIBLE_GOAL",
  ZERO_EXPENSES: "ZERO_EXPENSES",
  BALLOON_PAYMENT_REQUIRED: "BALLOON_PAYMENT_REQUIRED",
} as const;

export type FinancialWarningCode = (typeof FINANCIAL_WARNING_CODES)[keyof typeof FINANCIAL_WARNING_CODES];

export function createCompletenessResult(missing: string[], warnings: string[] = []): CompletenessResult {
  const uniqueMissing = Array.from(new Set(missing));
  const uniqueWarnings = Array.from(new Set(warnings));
  return {
    status: uniqueMissing.length > 0 ? "incomplete" : "complete",
    missing: uniqueMissing,
    warnings: uniqueWarnings,
  };
}
