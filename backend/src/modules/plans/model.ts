import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { households } from "../households/model";
import {
  CashFlowResponseSchema,
  CompletenessResultSchema,
  EmergencyFundResponseSchema,
  GoalFundingResponseSchema,
  InvestmentProjectionResponseSchema,
  LoanResponseSchema,
  NetWorthResponseSchema,
  ResolvedAssumptionsSchema,
  ScenarioDomainInputsSchema,
  ScenarioEvaluationResponseSchema,
} from "../financial-engine/model";
import type {
  CompletenessResult,
  ResolvedAssumptions,
  ScenarioDomainInputs,
  ScenarioEvaluationOutput,
} from "../financial-engine";

extendZodWithOpenApi(z);

// --- Financial Snapshots Table ---
export const financialSnapshots = pgTable(
  "financial_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    asOf: timestamp("as_of", { withTimezone: true }).notNull(),
    revision: integer("revision").notNull().default(0),
    engineVersion: text("engine_version").notNull().default("1.0.0"),
    policyVersion: text("policy_version").notNull().default("IN-2026.1"),
    inputs: jsonb("inputs").$type<ScenarioDomainInputs>().notNull(),
    resolvedAssumptions: jsonb("resolved_assumptions").$type<ResolvedAssumptions>().notNull(),
    completeness: jsonb("completeness").$type<CompletenessResult>().notNull(),
    inputHash: text("input_hash").notNull(),
    outputHash: text("output_hash").notNull(),
    calculatedOutput: jsonb("calculated_output")
      .$type<ScenarioEvaluationOutput["baseline"]>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("financial_snapshots_household_id_uidx").on(table.householdId, table.id),
    check("financial_snapshots_revision_check", sql`${table.revision} >= 0`),
    index("financial_snapshots_household_idx").on(table.householdId),
    index("financial_snapshots_household_as_of_idx").on(table.householdId, table.asOf),
  ],
);

// --- Plans Table ---
export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    currentVersionId: uuid("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("plans_household_uidx").on(table.householdId),
    uniqueIndex("plans_household_id_uidx").on(table.householdId, table.id),
    check("plans_status_check", sql`${table.status} IN ('active', 'archived')`),
    index("plans_household_idx").on(table.householdId),
  ],
);

// --- Plan Versions Table ---
export const planVersions = pgTable(
  "plan_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => financialSnapshots.id, { onDelete: "restrict" }),
    assumptions: jsonb("assumptions").$type<ResolvedAssumptions>().notNull(),
    scenarioOutput: jsonb("scenario_output").$type<ScenarioEvaluationOutput>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("plan_versions_household_id_uidx").on(table.householdId, table.id),
    uniqueIndex("plan_versions_plan_version_uidx").on(table.planId, table.versionNumber),
    foreignKey({
      columns: [table.householdId, table.planId],
      foreignColumns: [plans.householdId, plans.id],
      name: "plan_versions_household_plan_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.householdId, table.snapshotId],
      foreignColumns: [financialSnapshots.householdId, financialSnapshots.id],
      name: "plan_versions_household_snapshot_fk",
    }).onDelete("restrict"),
    check("plan_versions_version_number_positive", sql`${table.versionNumber} >= 1`),
    index("plan_versions_plan_created_idx").on(table.planId, table.createdAt),
    index("plan_versions_household_created_idx").on(table.householdId, table.createdAt),
    index("plan_versions_snapshot_idx").on(table.snapshotId),
  ],
);

export type SelectFinancialSnapshot = typeof financialSnapshots.$inferSelect;
export type InsertFinancialSnapshot = typeof financialSnapshots.$inferInsert;
export type SelectPlan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;
export type SelectPlanVersion = typeof planVersions.$inferSelect;
export type InsertPlanVersion = typeof planVersions.$inferInsert;

// --- Zod Schemas for Plans ---

export const RecalculatePlanRequestSchema = z
  .object({
    asOf: z.string().datetime({ message: "asOf must be a valid ISO-8601 UTC timestamp" }),
    revision: z.number().int().min(0, { message: "revision must be a non-negative integer" }),
    inputs: ScenarioDomainInputsSchema,
    policyVersion: z.string().optional(),
  })
  .strict();

export const SnapshotCalculatedOutputSchema = z.object({
  cashFlow: CashFlowResponseSchema.optional(),
  emergencyFund: EmergencyFundResponseSchema.optional(),
  loan: LoanResponseSchema.optional(),
  investment: InvestmentProjectionResponseSchema.optional(),
  goal: GoalFundingResponseSchema.optional(),
  netWorth: NetWorthResponseSchema.optional(),
});

export const FinancialSnapshotSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  asOf: z.string().datetime(),
  revision: z.number(),
  engineVersion: z.string(),
  policyVersion: z.string(),
  inputs: ScenarioDomainInputsSchema,
  resolvedAssumptions: ResolvedAssumptionsSchema,
  completeness: CompletenessResultSchema,
  inputHash: z.string(),
  outputHash: z.string(),
  calculatedOutput: SnapshotCalculatedOutputSchema,
  createdAt: z.string().datetime(),
});

export const PlanVersionSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  planId: z.string().uuid(),
  versionNumber: z.number(),
  snapshotId: z.string().uuid(),
  assumptions: ResolvedAssumptionsSchema,
  scenarioOutput: ScenarioEvaluationResponseSchema,
  createdAt: z.string().datetime(),
});

export const PlanSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  status: z.string(),
  currentVersionId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CurrentPlanResponseDataSchema = z.object({
  plan: PlanSchema,
  currentVersion: PlanVersionSchema,
  snapshot: FinancialSnapshotSchema,
});

export const CurrentPlanResponseSchema = z.object({
  data: CurrentPlanResponseDataSchema,
});

export const PlanHistoryItemSchema = z.object({
  version: PlanVersionSchema,
  snapshot: FinancialSnapshotSchema,
});

export const PlanHistoryResponseSchema = z.object({
  data: z.array(PlanHistoryItemSchema),
  nextCursor: z.string().optional(),
});
