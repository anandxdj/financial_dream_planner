import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { sql } from "drizzle-orm";
import {
  check,
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
import { users } from "../../database/models/user";

extendZodWithOpenApi(z);

export const CONSENT_PURPOSE = {
  documentStorage: "document_storage",
  privacyExport: "privacy_export",
  householdDeletion: "household_deletion",
} as const;

export const CONSENT_ACTION = {
  granted: "granted",
  withdrawn: "withdrawn",
} as const;

export const CONSENT_POLICY_VERSION = "2026.1" as const;

export const EXPORT_STATUS = {
  queued: "queued",
  running: "running",
  completed: "completed",
  failed: "failed",
  expired: "expired",
} as const;

export const DELETION_STATUS = {
  pendingConfirmation: "pending_confirmation",
  queued: "queued",
  running: "running",
  failed: "failed",
  completed: "completed",
} as const;

export type ConsentPurpose = (typeof CONSENT_PURPOSE)[keyof typeof CONSENT_PURPOSE];
export type ConsentAction = (typeof CONSENT_ACTION)[keyof typeof CONSENT_ACTION];
export type ExportStatus = (typeof EXPORT_STATUS)[keyof typeof EXPORT_STATUS];
export type DeletionStatus = (typeof DELETION_STATUS)[keyof typeof DELETION_STATUS];

// --- Consent Records Table ---
// Append-only compliance table without cascading FKs so consent records survive account deletion
export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull(),
    userId: uuid("user_id").notNull(),
    purpose: text("purpose").notNull(),
    policyVersion: text("policy_version").notNull().default("2026.1"),
    action: text("action").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("consent_records_household_idempotency_uidx").on(
      table.householdId,
      table.idempotencyKey,
    ),
    check(
      "consent_records_purpose_check",
      sql`${table.purpose} IN ('document_storage', 'privacy_export', 'household_deletion')`,
    ),
    check("consent_records_action_check", sql`${table.action} IN ('granted', 'withdrawn')`),
    index("consent_records_lookup_idx").on(
      table.householdId,
      table.userId,
      table.purpose,
      table.createdAt,
    ),
    index("consent_records_created_idx").on(table.createdAt),
  ],
);

// --- Privacy Exports Table ---
export const privacyExports = pgTable(
  "privacy_exports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    requestedByUserId: uuid("requested_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    objectKey: text("object_key"),
    byteSize: integer("byte_size"),
    checksum: text("checksum"),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("privacy_exports_household_idempotency_uidx").on(
      table.householdId,
      table.idempotencyKey,
    ),
    check(
      "privacy_exports_status_check",
      sql`${table.status} IN ('queued', 'running', 'completed', 'failed', 'expired')`,
    ),
    check("privacy_exports_attempts_check", sql`${table.attempts} >= 0`),
    index("privacy_exports_household_idx").on(table.householdId),
    index("privacy_exports_status_idx").on(table.status),
    index("privacy_exports_expires_idx").on(table.expiresAt),
    index("privacy_exports_retention_idx").on(table.retentionExpiresAt),
  ],
);

// --- Household Deletions Table ---
// Tombstone table without cascading FKs so minimal deletion proof survives account deletion
export const householdDeletions = pgTable(
  "household_deletions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull(),
    requestedByUserId: uuid("requested_by_user_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    confirmationTokenHash: text("confirmation_token_hash").notNull(),
    confirmationExpiresAt: timestamp("confirmation_expires_at", {
      withTimezone: true,
    }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    status: text("status").notNull().default("pending_confirmation"),
    attempts: integer("attempts").notNull().default(0),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("household_deletions_household_idempotency_uidx").on(
      table.householdId,
      table.idempotencyKey,
    ),
    check(
      "household_deletions_status_check",
      sql`${table.status} IN ('pending_confirmation', 'queued', 'running', 'failed', 'completed')`,
    ),
    check("household_deletions_attempts_check", sql`${table.attempts} >= 0`),
    index("household_deletions_household_idx").on(table.householdId),
    index("household_deletions_status_idx").on(table.status),
    index("household_deletions_retention_idx").on(table.retentionExpiresAt),
  ],
);

// --- Audit Events Table ---
// Append-only compliance audit table without cascading FKs
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id"),
    action: text("action").notNull(),
    actorType: text("actor_type").notNull().default("user"),
    actorId: text("actor_id"),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    requestId: text("request_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_events_household_idx").on(table.householdId),
    index("audit_events_action_idx").on(table.action),
    index("audit_events_created_idx").on(table.createdAt),
  ],
);

export type SelectConsentRecord = typeof consentRecords.$inferSelect;
export type InsertConsentRecord = typeof consentRecords.$inferInsert;
export type SelectPrivacyExport = typeof privacyExports.$inferSelect;
export type InsertPrivacyExport = typeof privacyExports.$inferInsert;
export type SelectHouseholdDeletion = typeof householdDeletions.$inferSelect;
export type InsertHouseholdDeletion = typeof householdDeletions.$inferInsert;
export type SelectAuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = typeof auditEvents.$inferInsert;

// --- Zod Schemas ---

export const CreateConsentRequestSchema = z
  .object({
    purpose: z.enum(["document_storage", "privacy_export", "household_deletion"]),
    action: z.enum(["granted", "withdrawn"]),
    policyVersion: z.literal(CONSENT_POLICY_VERSION).default(CONSENT_POLICY_VERSION),
    idempotencyKey: z.string().min(1).max(128),
  })
  .strict();

export const ConsentRecordSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  userId: z.string().uuid(),
  purpose: z.enum(["document_storage", "privacy_export", "household_deletion"]),
  policyVersion: z.string(),
  action: z.enum(["granted", "withdrawn"]),
  metadata: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string(),
  createdAt: z.string().datetime(),
});

export const EffectiveConsentStateSchema = z.object({
  granted: z.boolean(),
  policyVersion: z.string().nullable(),
  updatedAt: z.string().datetime().nullable(),
});

export const ConsentListResponseDataSchema = z.object({
  effective: z.record(z.string(), EffectiveConsentStateSchema),
  history: z.array(ConsentRecordSchema),
});

export const ConsentListResponseSchema = z.object({
  data: ConsentListResponseDataSchema,
});

export const ConsentResponseSchema = z.object({
  data: ConsentRecordSchema,
});

export const CreateExportRequestSchema = z
  .object({
    idempotencyKey: z.string().min(1).max(128),
  })
  .strict();

export const PrivacyExportSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  requestedByUserId: z.string().uuid(),
  status: z.enum(["queued", "running", "completed", "failed", "expired"]),
  attempts: z.number().int().nonnegative(),
  byteSize: z.number().int().nonnegative().nullable().optional(),
  checksum: z.string().nullable().optional(),
  failureCode: z.string().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ExportResponseSchema = z.object({
  data: PrivacyExportSchema,
});

export const CreateDeletionRequestSchema = z
  .object({
    idempotencyKey: z.string().min(1).max(128),
  })
  .strict();

export const ConfirmDeletionRequestSchema = z
  .object({
    confirmationToken: z.string().min(1),
  })
  .strict();

export const HouseholdDeletionSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  requestedByUserId: z.string().uuid(),
  status: z.enum(["pending_confirmation", "queued", "running", "failed", "completed"]),
  attempts: z.number().int().nonnegative(),
  confirmationExpiresAt: z.string().datetime(),
  confirmedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  failureCode: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateDeletionResponseDataSchema = z.object({
  deletion: HouseholdDeletionSchema,
  confirmationToken: z.string().optional(),
});

export const CreateDeletionResponseSchema = z.object({
  data: CreateDeletionResponseDataSchema,
});

export const DeletionResponseSchema = z.object({
  data: HouseholdDeletionSchema,
});

export const PrivacyIdParamsSchema = z
  .object({
    id: z.string().uuid({ message: "Invalid ID format" }),
  })
  .strict();

export const EmptyPrivacyActionBodySchema = z.object({}).strict();
