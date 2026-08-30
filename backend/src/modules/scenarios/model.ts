import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { sql } from "drizzle-orm";
import { check, foreignKey, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";
import { households } from "../households/model";
import { planVersions, PlanSchema, PlanVersionSchema, FinancialSnapshotSchema } from "../plans/model";
import { ScenarioDomainInputsSchema, ScenarioEvaluationResponseSchema } from "../financial-engine/model";
import type { ScenarioDomainInputs } from "../financial-engine";

extendZodWithOpenApi(z);

export const scenarios = pgTable(
  "scenarios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    baselineVersionId: uuid("baseline_version_id")
      .notNull()
      .references(() => planVersions.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    overlay: jsonb("overlay").$type<ScenarioDomainInputs>().notNull(),
    status: text("status").notNull().default("draft"),
    appliedVersionId: uuid("applied_version_id").references(() => planVersions.id, {
      onDelete: "set null",
    }),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("scenarios_household_id_uidx").on(table.householdId, table.id),
    foreignKey({
      columns: [table.householdId, table.baselineVersionId],
      foreignColumns: [planVersions.householdId, planVersions.id],
      name: "scenarios_household_baseline_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.householdId, table.appliedVersionId],
      foreignColumns: [planVersions.householdId, planVersions.id],
      name: "scenarios_household_applied_fk",
    }).onDelete("set null"),
    check("scenarios_status_check", sql`${table.status} IN ('draft', 'applied')`),
    check(
      "scenarios_applied_state_check",
      sql`(${table.status} = 'draft' AND ${table.appliedVersionId} IS NULL AND ${table.appliedAt} IS NULL) OR (${table.status} = 'applied' AND ${table.appliedVersionId} IS NOT NULL AND ${table.appliedAt} IS NOT NULL)`,
    ),
    index("scenarios_household_status_idx").on(table.householdId, table.status),
    index("scenarios_baseline_version_idx").on(table.baselineVersionId),
    index("scenarios_household_created_idx").on(table.householdId, table.createdAt),
  ],
);

export type SelectScenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

// --- Zod Schemas for Scenarios ---

export const CreateScenarioRequestSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Name is required" }).max(100),
    description: z.string().trim().max(500).optional(),
    overlay: ScenarioDomainInputsSchema,
  })
  .strict();

export const ScenarioSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  baselineVersionId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  overlay: ScenarioDomainInputsSchema,
  status: z.enum(["draft", "applied"]),
  appliedVersionId: z.string().uuid().nullable(),
  appliedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ScenarioResponseSchema = z.object({
  data: ScenarioSchema,
});

export const ScenarioListResponseSchema = z.object({
  data: z.array(ScenarioSchema),
});

export const CompareScenariosRequestSchema = z
  .object({
    scenarioIds: z
      .array(z.string().uuid())
      .min(2, { message: "Comparison requires at least 2 scenarios" })
      .max(10, { message: "Comparison accepts at most 10 scenarios" })
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Scenario IDs must be unique",
      }),
  })
  .strict();

export const CompareScenariosResponseDataSchema = z.object({
  baselineVersionId: z.string().uuid(),
  scenarios: z.array(ScenarioEvaluationResponseSchema),
});

export const CompareScenariosResponseSchema = z.object({
  data: CompareScenariosResponseDataSchema,
});

export const RunScenarioResponseSchema = z.object({
  data: ScenarioEvaluationResponseSchema,
});

export const ApplyScenarioResponseDataSchema = z.object({
  plan: PlanSchema,
  version: PlanVersionSchema,
  snapshot: FinancialSnapshotSchema,
});

export const ApplyScenarioResponseSchema = z.object({
  data: ApplyScenarioResponseDataSchema,
});
