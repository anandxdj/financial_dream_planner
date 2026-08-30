import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const decimalString = z.string().trim().regex(/^-?\d+(?:\.\d+)?$/);
export const nonNegativeDecimalString = z.string().trim().regex(/^\d+(?:\.\d+)?$/);
export const positiveDecimalString = z.string().trim().regex(/^(?!0+(?:\.0+)?$)\d+(?:\.\d+)?$/);

export const CompletenessResultSchema = z.object({
  status: z.enum(["complete", "incomplete"]),
  missing: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const ResolvedAssumptionsSchema = z.object({
  policyVersion: z.string(),
  generalInflation: z.string(),
  educationInflation: z.string(),
  medicalInflation: z.string(),
  returns: z.object({
    conservative: z.string(),
    expected: z.string(),
    optimistic: z.string(),
  }),
  annualStepUp: z.string(),
  emergencyReserveMonths: z.object({
    stable: z.number(),
    variable: z.number(),
    irregular: z.number(),
  }),
});

// 1. Cash Flow
export const CashFlowRequestSchema = z.object({
  income: nonNegativeDecimalString.optional(),
  essentialExpenses: nonNegativeDecimalString.optional(),
  discretionaryExpenses: nonNegativeDecimalString.optional(),
  emis: nonNegativeDecimalString.optional(),
  mandatoryObligations: nonNegativeDecimalString.optional(),
  policyVersion: z.string().optional(),
}).strict();

export const CashFlowResponseSchema = z.object({
  monthlyIncome: z.string().nullable(),
  essentialExpenses: z.string().nullable(),
  discretionaryExpenses: z.string().nullable(),
  emis: z.string().nullable(),
  mandatoryObligations: z.string().nullable(),
  totalExpenses: z.string().nullable(),
  fixedObligations: z.string().nullable(),
  totalOutflows: z.string().nullable(),
  monthlySurplus: z.string().nullable(),
  savingsRate: z.string().nullable(),
  investableCapacity: z.string().nullable(),
  completeness: CompletenessResultSchema,
  policyVersion: z.string(),
  resolvedAssumptions: ResolvedAssumptionsSchema,
});

// 2. Emergency Fund
export const EmergencyFundRequestSchema = z.object({
  essentialExpenses: nonNegativeDecimalString.optional(),
  emis: nonNegativeDecimalString.optional(),
  mandatoryObligations: nonNegativeDecimalString.optional(),
  incomeStability: z.enum(["stable", "variable", "irregular"]).optional(),
  dependents: z.number().int().min(0).optional(),
  currentReserves: nonNegativeDecimalString.optional(),
  monthlyContribution: nonNegativeDecimalString.optional(),
  customReserveMonths: z.number().int().min(1).max(60).optional(),
  policyVersion: z.string().optional(),
}).strict();

export const EmergencyFundResponseSchema = z.object({
  monthlyNeed: z.string().nullable(),
  baseReserveMonths: z.number().nullable(),
  dependentsUpliftMonths: z.number().nullable(),
  targetReserveMonths: z.number().nullable(),
  targetAmount: z.string().nullable(),
  currentReserves: z.string().nullable(),
  runwayMonths: z.string().nullable(),
  shortfall: z.string().nullable(),
  completionMonths: z.number().nullable(),
  completeness: CompletenessResultSchema,
  policyVersion: z.string(),
  resolvedAssumptions: ResolvedAssumptionsSchema,
});

// 3. Loan
export const PrepaymentItemSchema = z.object({
  month: z.number().int().min(1),
  amount: positiveDecimalString,
}).strict();

export const RefinancingOptionSchema = z.object({
  newAnnualRate: nonNegativeDecimalString,
  newTenureMonths: z.number().int().min(1).optional(),
  processingFee: nonNegativeDecimalString.optional(),
}).strict();

export const LoanRequestSchema = z.object({
  principal: positiveDecimalString.optional(),
  annualRate: nonNegativeDecimalString.optional(),
  tenureMonths: z.number().int().min(1).optional(),
  prepayments: z.array(PrepaymentItemSchema).optional(),
  prepaymentStrategy: z.enum(["reduce_tenure", "reduce_emi"]).optional(),
  refinancing: RefinancingOptionSchema.optional(),
  policyVersion: z.string().optional(),
}).strict();

export const AmortizationRowSchema = z.object({
  month: z.number(),
  payment: z.string(),
  principal: z.string(),
  interest: z.string(),
  remainingBalance: z.string(),
});

export const PrepaymentComparisonSchema = z.object({
  originalTotalInterest: z.string(),
  revisedTotalInterest: z.string(),
  interestSaved: z.string(),
  originalTenureMonths: z.number(),
  revisedTenureMonths: z.number(),
  monthsSaved: z.number(),
  revisedMonthlyEmi: z.string(),
  schedule: z.array(AmortizationRowSchema),
});

export const RefinancingComparisonSchema = z.object({
  currentRemainingInterest: z.string(),
  newMonthlyEmi: z.string(),
  newTotalInterest: z.string(),
  processingFee: z.string(),
  netSavings: z.string(),
  isBeneficial: z.boolean(),
});

export const LoanResponseSchema = z.object({
  monthlyEmi: z.string().nullable(),
  totalPrincipal: z.string().nullable(),
  totalInterest: z.string().nullable(),
  totalPayment: z.string().nullable(),
  tenureMonths: z.number().nullable(),
  annualRate: z.string().nullable(),
  monthlyRate: z.string().nullable(),
  schedule: z.array(AmortizationRowSchema),
  prepaymentComparison: PrepaymentComparisonSchema.nullable(),
  refinancingComparison: RefinancingComparisonSchema.nullable(),
  completeness: CompletenessResultSchema,
  policyVersion: z.string(),
  resolvedAssumptions: ResolvedAssumptionsSchema,
});

// 4. Investment Projection
export const InvestmentProjectionRequestSchema = z.object({
  initialLumpSum: nonNegativeDecimalString.optional(),
  monthlySip: nonNegativeDecimalString.optional(),
  annualStepUp: nonNegativeDecimalString.optional(),
  horizonMonths: z.number().int().min(1).optional(),
  customAnnualRate: nonNegativeDecimalString.optional(),
  policyVersion: z.string().optional(),
}).strict();

export const ProjectionMilestoneSchema = z.object({
  month: z.number(),
  year: z.number(),
  totalInvested: z.string(),
  futureValue: z.string(),
  totalGains: z.string(),
});

export const ScenarioProjectionResultSchema = z.object({
  scenarioName: z.string(),
  annualRate: z.string(),
  totalInvested: z.string(),
  futureValue: z.string(),
  totalGains: z.string(),
  milestones: z.array(ProjectionMilestoneSchema),
});

export const InvestmentProjectionResponseSchema = z.object({
  initialLumpSum: z.string().nullable(),
  monthlySip: z.string().nullable(),
  annualStepUp: z.string().nullable(),
  horizonMonths: z.number().nullable(),
  scenarios: z.record(z.string(), ScenarioProjectionResultSchema),
  completeness: CompletenessResultSchema,
  policyVersion: z.string(),
  resolvedAssumptions: ResolvedAssumptionsSchema,
});

// 5. Goal Funding
export const GoalFundingRequestSchema = z.object({
  goalName: z.string().trim().max(100).optional(),
  goalCategory: z.enum(["general", "education", "medical", "retirement", "home", "custom"]).optional(),
  targetAmountToday: positiveDecimalString.optional(),
  horizonMonths: z.number().int().min(1).optional(),
  currentSavings: nonNegativeDecimalString.optional(),
  availableMonthlyCapacity: nonNegativeDecimalString.optional(),
  expectedAnnualReturn: nonNegativeDecimalString.optional(),
  annualInflation: nonNegativeDecimalString.optional(),
  policyVersion: z.string().optional(),
}).strict();

export const GoalFundingResponseSchema = z.object({
  goalName: z.string().nullable(),
  goalCategory: z.string(),
  targetAmountToday: z.string().nullable(),
  futureGoalCost: z.string().nullable(),
  currentSavings: z.string().nullable(),
  currentSavingsFutureValue: z.string().nullable(),
  fundingRatio: z.string().nullable(),
  shortfall: z.string().nullable(),
  requiredSip: z.string().nullable(),
  requiredLumpSum: z.string().nullable(),
  availableMonthlyCapacity: z.string().nullable(),
  feasibility: z.enum(["funded", "feasible", "infeasible", "unconstrained"]).nullable(),
  horizonMonths: z.number().nullable(),
  annualInflationUsed: z.string(),
  expectedReturnUsed: z.string(),
  completeness: CompletenessResultSchema,
  policyVersion: z.string(),
  resolvedAssumptions: ResolvedAssumptionsSchema,
});

// 6. Net Worth
export const AssetItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(50),
  value: nonNegativeDecimalString,
}).strict();

export const LiabilityItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(50),
  value: nonNegativeDecimalString,
}).strict();

export const CategoryAllocationSchema = z.object({
  category: z.string(),
  totalValue: z.string(),
  percentage: z.string(),
});

export const NetWorthRequestSchema = z.object({
  assets: z.array(AssetItemSchema).optional(),
  liabilities: z.array(LiabilityItemSchema).optional(),
  policyVersion: z.string().optional(),
}).strict();

export const NetWorthResponseSchema = z.object({
  totalAssets: z.string().nullable(),
  totalLiabilities: z.string().nullable(),
  netWorth: z.string().nullable(),
  assetAllocations: z.array(CategoryAllocationSchema),
  liabilityBreakdown: z.array(CategoryAllocationSchema),
  completeness: CompletenessResultSchema,
  policyVersion: z.string(),
  resolvedAssumptions: ResolvedAssumptionsSchema,
});

// 7. Scenario Evaluation
export const ScenarioDomainInputsSchema = z.object({
  cashFlow: CashFlowRequestSchema.optional(),
  emergencyFund: EmergencyFundRequestSchema.optional(),
  loan: LoanRequestSchema.optional(),
  investment: InvestmentProjectionRequestSchema.optional(),
  goal: GoalFundingRequestSchema.optional(),
  netWorth: NetWorthRequestSchema.optional(),
}).strict();

export const ScenarioEvaluationRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  baseline: ScenarioDomainInputsSchema,
  scenario: ScenarioDomainInputsSchema,
  policyVersion: z.string().optional(),
}).strict();

export const CashFlowDeltaSchema = z.object({
  monthlyIncomeDelta: z.string().nullable(),
  totalExpensesDelta: z.string().nullable(),
  monthlySurplusDelta: z.string().nullable(),
  savingsRateDelta: z.string().nullable(),
  investableCapacityDelta: z.string().nullable(),
});

export const EmergencyFundDeltaSchema = z.object({
  monthlyNeedDelta: z.string().nullable(),
  targetAmountDelta: z.string().nullable(),
  runwayMonthsDelta: z.string().nullable(),
  shortfallDelta: z.string().nullable(),
  completionMonthsDelta: z.number().nullable(),
});

export const LoanDeltaSchema = z.object({
  monthlyEmiDelta: z.string().nullable(),
  totalInterestDelta: z.string().nullable(),
  totalPaymentDelta: z.string().nullable(),
  tenureMonthsDelta: z.number().nullable(),
});

export const InvestmentDeltaSchema = z.object({
  expectedFutureValueDelta: z.string().nullable(),
  expectedTotalInvestedDelta: z.string().nullable(),
  expectedGainsDelta: z.string().nullable(),
});

export const GoalDeltaSchema = z.object({
  futureGoalCostDelta: z.string().nullable(),
  shortfallDelta: z.string().nullable(),
  requiredSipDelta: z.string().nullable(),
  fundingRatioDelta: z.string().nullable(),
  feasibilityChanged: z.boolean(),
});

export const NetWorthDeltaSchema = z.object({
  totalAssetsDelta: z.string().nullable(),
  totalLiabilitiesDelta: z.string().nullable(),
  netWorthDelta: z.string().nullable(),
});

export const ScenarioDeltasSchema = z.object({
  cashFlow: CashFlowDeltaSchema.optional(),
  emergencyFund: EmergencyFundDeltaSchema.optional(),
  loan: LoanDeltaSchema.optional(),
  investment: InvestmentDeltaSchema.optional(),
  goal: GoalDeltaSchema.optional(),
  netWorth: NetWorthDeltaSchema.optional(),
});

export const ScenarioEvaluationResponseSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  baseline: z.object({
    cashFlow: CashFlowResponseSchema.optional(),
    emergencyFund: EmergencyFundResponseSchema.optional(),
    loan: LoanResponseSchema.optional(),
    investment: InvestmentProjectionResponseSchema.optional(),
    goal: GoalFundingResponseSchema.optional(),
    netWorth: NetWorthResponseSchema.optional(),
  }),
  scenario: z.object({
    cashFlow: CashFlowResponseSchema.optional(),
    emergencyFund: EmergencyFundResponseSchema.optional(),
    loan: LoanResponseSchema.optional(),
    investment: InvestmentProjectionResponseSchema.optional(),
    goal: GoalFundingResponseSchema.optional(),
    netWorth: NetWorthResponseSchema.optional(),
  }),
  deltas: ScenarioDeltasSchema,
  completeness: CompletenessResultSchema,
  policyVersion: z.string(),
  resolvedAssumptions: ResolvedAssumptionsSchema,
});
