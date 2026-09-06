import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { InvestmentProjectionResponseSchema } from "../financial-engine/model";

extendZodWithOpenApi(z);

export const money = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d+)?$/, "Must be a non-negative decimal string");
export const rate = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d+)?$/, "Must be a non-negative decimal string");

export const UpdateInvestmentInputsRequestSchema = z
  .object({
    initialLumpSum: money.optional().nullable(),
    monthlySip: money.optional().nullable(),
    annualStepUp: rate.optional().nullable(),
    horizonMonths: z.number().int().min(1).max(600).optional().nullable(),
    customAnnualRate: rate.optional().nullable(),
    expectedRevision: z.number().int().min(0, "expectedRevision must be non-negative"),
  })
  .strict();

export const SimulateInvestmentRequestSchema = z
  .object({
    initialLumpSum: money.optional(),
    monthlySip: money.optional(),
    annualStepUp: rate.optional(),
    horizonMonths: z.number().int().min(1).max(600).optional(),
    customAnnualRate: rate.optional(),
    policyVersion: z.string().optional(),
  })
  .strict();

export const InvestmentAccountViewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  institutionName: z.string().nullable(),
  currentBalance: z.string().nullable(),
  balanceUpdatedAt: z.string().datetime().nullable(),
});

export const AssetAllocationItemSchema = z.object({
  assetClass: z.string(),
  percentage: z.string().nullable(),
  estimatedAmount: z.string().nullable(),
  isConfigured: z.boolean(),
});

export const LinkedGoalViewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  targetAmount: z.string(),
  currentSavings: z.string(),
  monthlyContribution: z.string(),
  targetDate: z.string(),
  horizonMonths: z.number().int(),
});

export const UnavailableValueSchema = z.object({
  field: z.string(),
  status: z.literal("unavailable"),
  reason: z.string(),
});

export const InvestmentSummaryDataSchema = z.object({
  inputs: z.object({
    initialLumpSum: z.string().nullable(),
    monthlySip: z.string().nullable(),
    annualStepUp: z.string().nullable(),
    horizonMonths: z.number().int().nullable(),
    customAnnualRate: z.string().nullable(),
    revision: z.number().int().min(0),
  }),
  projection: InvestmentProjectionResponseSchema,
  scenarioRanges: z.object({
    conservative: z.string(),
    expected: z.string(),
    optimistic: z.string(),
    custom: z.string().nullable(),
    explanation: z.string(),
  }),
  accounts: z.array(InvestmentAccountViewSchema),
  totalTrackedBalance: z.string().nullable(),
  assetAllocation: z.object({
    isConfigured: z.boolean(),
    allocations: z.array(AssetAllocationItemSchema),
    note: z.string(),
  }),
  linkedGoals: z.array(LinkedGoalViewSchema),
  totalMonthlyGoalCommitment: z.string(),
  unavailableValues: z.array(UnavailableValueSchema),
  disclaimer: z.string(),
});

export const InvestmentSummaryResponseSchema = z.object({
  data: InvestmentSummaryDataSchema,
});

export const InvestmentSimulationResponseSchema = z.object({
  data: InvestmentProjectionResponseSchema,
});
