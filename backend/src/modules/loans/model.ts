import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { households } from "../households/model";
import { accounts } from "../accounts/model";
import { LoanResponseSchema as FinancialEngineLoanResponseSchema } from "../financial-engine/model";

extendZodWithOpenApi(z);

export const LOAN_TYPES = [
  "home",
  "car",
  "personal",
  "education",
  "credit_card",
  "other",
] as const;
export type LoanType = (typeof LOAN_TYPES)[number];

export const LOAN_STATUSES = ["active", "closed", "archived"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const loans = pgTable(
  "loans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("other"),
    originalPrincipal: numeric("original_principal", { precision: 19, scale: 4 }),
    outstandingPrincipal: numeric("outstanding_principal", { precision: 19, scale: 4 }).notNull(),
    interestRate: numeric("interest_rate", { precision: 7, scale: 4 }),
    remainingTenureMonths: integer("remaining_tenure_months"),
    monthlyEmi: numeric("monthly_emi", { precision: 19, scale: 4 }),
    nextDueDate: text("next_due_date"),
    lenderName: text("lender_name"),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    prepayments: jsonb("prepayments")
      .$type<Array<{ month: number; amount: string }>>()
      .notNull()
      .default([]),
    status: text("status").notNull().default("active"),
    revision: integer("revision").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("loans_household_id_uidx").on(table.householdId, table.id),
    index("loans_household_idx").on(table.householdId),
    index("loans_household_status_idx").on(table.householdId, table.status),
    check("loans_type_check", sql`${table.type} in ('home','car','personal','education','credit_card','other')`),
    check("loans_status_check", sql`${table.status} in ('active','closed','archived')`),
    check("loans_outstanding_principal_check", sql`${table.outstandingPrincipal} >= 0`),
    check("loans_revision_check", sql`${table.revision} >= 0`),
  ],
);

export type SelectLoan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

// --- Zod Schemas ---
const money = z.string().trim().regex(/^\d+(?:\.\d+)?$/, "Must be a non-negative decimal string");
const rate = z.string().trim().regex(/^\d+(?:\.\d+)?$/, "Must be a non-negative decimal string");

export const PrepaymentItemSchema = z
  .object({
    month: z.number().int().min(1, "Month must be at least 1"),
    amount: money,
  })
  .strict();

export const CreateLoanRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    type: z.enum(LOAN_TYPES).default("other"),
    originalPrincipal: money.optional(),
    outstandingPrincipal: money,
    interestRate: rate.optional(),
    remainingTenureMonths: z.number().int().min(1).max(600).optional(),
    monthlyEmi: money.optional(),
    nextDueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "nextDueDate must be YYYY-MM-DD")
      .optional(),
    lenderName: z.string().trim().max(100).optional(),
    accountId: z.string().uuid().optional(),
    prepayments: z.array(PrepaymentItemSchema).max(120).optional(),
  })
  .strict();

export const UpdateLoanRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    type: z.enum(LOAN_TYPES).optional(),
    originalPrincipal: money.optional().nullable(),
    outstandingPrincipal: money.optional(),
    interestRate: rate.optional().nullable(),
    remainingTenureMonths: z.number().int().min(1).max(600).optional().nullable(),
    monthlyEmi: money.optional().nullable(),
    nextDueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "nextDueDate must be YYYY-MM-DD")
      .optional()
      .nullable(),
    lenderName: z.string().trim().max(100).optional().nullable(),
    accountId: z.string().uuid().optional().nullable(),
    prepayments: z.array(PrepaymentItemSchema).max(120).optional(),
    status: z.enum(LOAN_STATUSES).optional(),
    expectedRevision: z.number().int().min(0).optional(),
  })
  .strict();

export const LoanSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  name: z.string(),
  type: z.enum(LOAN_TYPES),
  originalPrincipal: z.string().nullable(),
  outstandingPrincipal: z.string(),
  interestRate: z.string().nullable(),
  remainingTenureMonths: z.number().int().nullable(),
  monthlyEmi: z.string().nullable(),
  nextDueDate: z.string().nullable(),
  lenderName: z.string().nullable(),
  accountId: z.string().uuid().nullable(),
  prepayments: z.array(PrepaymentItemSchema),
  status: z.enum(LOAN_STATUSES),
  revision: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const LoanResponseSchema = z.object({
  data: LoanSchema,
});

export const LoanSummarySchema = z.object({
  totalOutstandingPrincipal: z.string(),
  totalMonthlyEmi: z.string(),
  activeLoansCount: z.number().int().min(0),
});

export const LoanListResponseSchema = z.object({
  data: z.array(LoanSchema),
  summary: LoanSummarySchema,
});

export const LoanAnalysisResponseSchema = z.object({
  data: z.object({
    loan: LoanSchema,
    analysis: FinancialEngineLoanResponseSchema,
    disclaimer: z.string(),
  }),
});

export const PrepaymentSimulationRequestSchema = z
  .object({
    prepayments: z.array(PrepaymentItemSchema).min(1, "At least one prepayment required").max(120),
    prepaymentStrategy: z.enum(["reduce_tenure", "reduce_emi"]).default("reduce_tenure"),
  })
  .strict();

export const AmortizationRowSchema = z.object({
  month: z.number().int(),
  payment: z.string(),
  principal: z.string(),
  interest: z.string(),
  remainingBalance: z.string(),
});

export const PrepaymentSimulationResponseSchema = z.object({
  data: z.object({
    loanId: z.string().uuid(),
    loanName: z.string(),
    prepaymentStrategy: z.enum(["reduce_tenure", "reduce_emi"]),
    original: z.object({
      totalInterest: z.string(),
      tenureMonths: z.number().int(),
      monthlyEmi: z.string(),
    }),
    revised: z.object({
      totalInterest: z.string(),
      tenureMonths: z.number().int(),
      monthlyEmi: z.string(),
      interestSaved: z.string(),
      monthsSaved: z.number().int(),
    }),
    schedule: z.array(AmortizationRowSchema),
    planningImpact: z.object({
      lumpSumPaid: z.string(),
      monthlyEmiDelta: z.string(),
      liquidSavingsRemaining: z.string().nullable(),
      bufferMonthsRemaining: z.string().nullable(),
      emergencyFundSafe: z.boolean().nullable(),
      goalImpactSummary: z.string(),
    }),
    disclaimer: z.string(),
  }),
});

export const CreatePrepaymentScenarioRequestSchema = z
  .object({
    scenarioName: z.string().trim().min(1, "Scenario name is required").max(100),
    description: z.string().trim().max(500).optional(),
    prepayments: z.array(PrepaymentItemSchema).min(1).max(120),
    prepaymentStrategy: z.enum(["reduce_tenure", "reduce_emi"]).default("reduce_tenure"),
  })
  .strict();
