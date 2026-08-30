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
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { households } from "../households/model";
import { planVersions } from "../plans/model";
import {
  FinancialSnapshotSchema,
  PlanSchema,
  PlanVersionSchema,
} from "../plans/model";
import { ScenarioDomainInputsSchema } from "../financial-engine/model";
import type {
  ScenarioDomainInputs,
  ScenarioDeltas,
  ScenarioEvaluationOutput,
} from "../financial-engine";

extendZodWithOpenApi(z);

export const DRIFT_FINDING_CODES = [
  "income_changed",
  "spending_changed",
  "obligations_changed",
  "surplus_changed",
  "reserve_runway_changed",
  "investment_contribution_changed",
  "debt_terms_changed",
  "goal_changed",
  "net_worth_changed",
] as const;
export type DriftFindingCode = (typeof DRIFT_FINDING_CODES)[number];

export const DRIFT_SEVERITIES = ["notice", "warning", "critical"] as const;
export type DriftSeverity = (typeof DRIFT_SEVERITIES)[number];

export const DRIFT_CHECK_STATUSES = ["queued", "running", "completed", "failed"] as const;
export type DriftCheckStatus = (typeof DRIFT_CHECK_STATUSES)[number];

export const DRIFT_CHECK_MODES = ["lightweight", "deep"] as const;
export type DriftCheckMode = (typeof DRIFT_CHECK_MODES)[number];

export const DRIFT_EVENT_STATUSES = ["pending", "kept", "accepted", "no_change"] as const;
export type DriftEventStatus = (typeof DRIFT_EVENT_STATUSES)[number];

// --- Zod Finding Schema ---
export const DriftFindingSchema = z.object({
  code: z.enum(DRIFT_FINDING_CODES),
  description: z.string(),
  baselineValue: z.string().nullable(),
  observedValue: z.string().nullable(),
  absoluteDelta: z.string().nullable(),
  relativeDelta: z.string().nullable(),
  severity: z.enum(DRIFT_SEVERITIES),
  affectedOutputPaths: z.array(z.string()),
});
export type DriftFinding = z.infer<typeof DriftFindingSchema>;

// --- Drift Checks Table ---
export const driftChecks = pgTable(
  "drift_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    baselineVersionId: uuid("baseline_version_id")
      .notNull()
      .references(() => planVersions.id, { onDelete: "cascade" }),
    mode: text("mode").notNull().default("lightweight"),
    asOf: timestamp("as_of", { withTimezone: true }).notNull(),
    revision: integer("revision").notNull().default(0),
    observedInputHash: text("observed_input_hash").notNull(),
    inputs: jsonb("inputs").$type<ScenarioDomainInputs>().notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("drift_checks_household_id_uniq").on(table.householdId, table.id),
    uniqueIndex("drift_checks_household_idempotency_uidx").on(
      table.householdId,
      table.idempotencyKey,
    ),
    uniqueIndex("drift_checks_canonical_uidx").on(
      table.householdId,
      table.baselineVersionId,
      table.mode,
      table.observedInputHash,
      table.revision,
    ),
    foreignKey({
      columns: [table.householdId, table.baselineVersionId],
      foreignColumns: [planVersions.householdId, planVersions.id],
      name: "drift_checks_household_baseline_fk",
    }).onDelete("cascade"),
    check("drift_checks_mode_check", sql`${table.mode} IN ('lightweight', 'deep')`),
    check(
      "drift_checks_status_check",
      sql`${table.status} IN ('queued', 'running', 'completed', 'failed')`,
    ),
    check("drift_checks_revision_check", sql`${table.revision} >= 0`),
    check("drift_checks_attempts_check", sql`${table.attempts} >= 0`),
    index("drift_checks_household_idx").on(table.householdId),
    index("drift_checks_household_created_idx").on(table.householdId, table.createdAt),
    index("drift_checks_retention_idx").on(table.retentionExpiresAt),
  ],
);

// --- Drift Events Table ---
export const driftEvents = pgTable(
  "drift_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    checkId: uuid("check_id")
      .notNull()
      .references(() => driftChecks.id, { onDelete: "cascade" }),
    baselineVersionId: uuid("baseline_version_id")
      .notNull()
      .references(() => planVersions.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    findings: jsonb("findings").$type<DriftFinding[]>().notNull().default([]),
    policyVersion: text("policy_version").notNull().default("DRIFT-IN-2026.1"),
    engineVersion: text("engine_version").notNull().default("1.0.0"),
    observedInputs: jsonb("observed_inputs").$type<ScenarioDomainInputs>().notNull(),
    observedCalculatedOutput: jsonb("observed_calculated_output").$type<ScenarioEvaluationOutput["baseline"] | null>(),
    observedOutputHash: text("observed_output_hash").notNull(),
    deltas: jsonb("deltas").$type<ScenarioDeltas | null>(),
    createdVersionId: uuid("created_version_id").references(() => planVersions.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }),
  },
  (table) => [
    unique("drift_events_household_id_uniq").on(table.householdId, table.id),
    uniqueIndex("drift_events_check_uidx").on(table.checkId),
    foreignKey({
      columns: [table.householdId, table.checkId],
      foreignColumns: [driftChecks.householdId, driftChecks.id],
      name: "drift_events_household_check_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.householdId, table.baselineVersionId],
      foreignColumns: [planVersions.householdId, planVersions.id],
      name: "drift_events_household_baseline_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.householdId, table.createdVersionId],
      foreignColumns: [planVersions.householdId, planVersions.id],
      name: "drift_events_household_created_version_fk",
    }).onDelete("set null"),
    check(
      "drift_events_status_check",
      sql`${table.status} IN ('pending', 'kept', 'accepted', 'no_change')`,
    ),
    index("drift_events_household_idx").on(table.householdId),
    index("drift_events_household_status_idx").on(table.householdId, table.status),
    index("drift_events_household_baseline_idx").on(table.householdId, table.baselineVersionId),
    index("drift_events_household_created_idx").on(table.householdId, table.createdAt),
    index("drift_events_retention_idx").on(table.retentionExpiresAt),
  ],
);

export type SelectDriftCheck = typeof driftChecks.$inferSelect;
export type InsertDriftCheck = typeof driftChecks.$inferInsert;
export type SelectDriftEvent = typeof driftEvents.$inferSelect;
export type InsertDriftEvent = typeof driftEvents.$inferInsert;

// --- Zod Request/Response Schemas ---

export const CreateDriftCheckRequestSchema = z
  .object({
    baselineVersionId: z.string().uuid(),
    mode: z.enum(DRIFT_CHECK_MODES),
    asOf: z.string().datetime({ message: "asOf must be a valid ISO-8601 UTC timestamp" }),
    revision: z.number().int().min(0, { message: "revision must be a non-negative integer" }),
    inputs: ScenarioDomainInputsSchema,
    idempotencyKey: z.string().trim().min(1).max(128),
  })
  .strict();

export const DriftCheckSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  baselineVersionId: z.string().uuid(),
  mode: z.enum(DRIFT_CHECK_MODES),
  asOf: z.string().datetime(),
  revision: z.number().int(),
  observedInputHash: z.string(),
  inputs: ScenarioDomainInputsSchema,
  idempotencyKey: z.string(),
  status: z.enum(DRIFT_CHECK_STATUSES),
  attempts: z.number().int(),
  failureCode: z.string().nullable(),
  failureMessage: z.string().nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  retentionExpiresAt: z.string().datetime(),
});

export const DriftEventSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  checkId: z.string().uuid(),
  baselineVersionId: z.string().uuid(),
  status: z.enum(DRIFT_EVENT_STATUSES),
  findings: z.array(DriftFindingSchema),
  policyVersion: z.string(),
  engineVersion: z.string(),
  observedInputs: ScenarioDomainInputsSchema,
  observedCalculatedOutput: z.record(z.string(), z.unknown()).nullable(),
  observedOutputHash: z.string(),
  deltas: z.record(z.string(), z.unknown()).nullable(),
  createdVersionId: z.string().uuid().nullable(),
  resolvedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  retentionExpiresAt: z.string().datetime().nullable(),
});

export const DriftCheckResponseSchema = z.object({
  data: DriftCheckSchema,
});

export const DriftCheckWithEventResponseSchema = z.object({
  data: z.object({
    check: DriftCheckSchema,
    event: DriftEventSchema.nullable(),
  }),
});

export const DriftEventResponseSchema = z.object({
  data: DriftEventSchema,
});

export const CurrentDriftEventResponseSchema = z.object({
  data: DriftEventSchema.nullable(),
});

export const DriftEventListResponseSchema = z.object({
  data: z.array(DriftEventSchema),
  nextCursor: z.string().optional(),
});

export const AcceptDriftResponseSchema = z.object({
  data: z.object({
    event: DriftEventSchema,
    plan: PlanSchema,
    version: PlanVersionSchema,
    snapshot: FinancialSnapshotSchema,
  }),
});

export const KeepDriftResponseSchema = z.object({
  data: DriftEventSchema,
});

export const DriftEventListQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(DRIFT_EVENT_STATUSES).optional(),
  })
  .strict();

export const DriftIdParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const EmptyDriftActionBodySchema = z.object({}).strict();
