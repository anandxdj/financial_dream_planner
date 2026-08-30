import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { households } from "../households/model";
import { users } from "../../database/models/user";

extendZodWithOpenApi(z);

export const SOURCE_TYPES = [
  "government_regulator",
  "exchange_official_filing",
  "official_provider",
  "structured_finance_api",
  "reputable_publication",
  "community",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const RESEARCH_STATUSES = ["queued", "running", "completed", "failed"] as const;
export type ResearchStatus = (typeof RESEARCH_STATUSES)[number];

// --- Research Runs Table ---
export const researchRuns = pgTable(
  "research_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    topic: text("topic").notNull(),
    status: text("status").notNull().default("queued"),
    provider: text("provider").notNull().default("tavily"),
    failureCode: text("failure_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("research_runs_household_id_uniq").on(table.householdId, table.id),
    check(
      "research_runs_status_check",
      sql`${table.status} IN ('queued', 'running', 'completed', 'failed')`,
    ),
    index("research_runs_household_idx").on(table.householdId),
    index("research_runs_household_created_idx").on(table.householdId, table.createdAt),
    index("research_runs_retention_idx").on(table.retentionExpiresAt),
  ],
);

// --- Evidence Table ---
export const evidence = pgTable(
  "evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    researchRunId: uuid("research_run_id")
      .notNull()
      .references(() => researchRuns.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
    claim: text("claim").notNull(),
    canonicalSourceUrl: text("canonical_source_url").notNull(),
    publisher: text("publisher").notNull(),
    sourceType: text("source_type").notNull(),
    publicationTime: timestamp("publication_time", { withTimezone: true }),
    effectiveTime: timestamp("effective_time", { withTimezone: true }),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull().defaultNow(),
    freshnessExpiresAt: timestamp("freshness_expires_at", { withTimezone: true }).notNull(),
    contentHash: text("content_hash").notNull(),
    supportingExcerpt: text("supporting_excerpt").notNull(),
    confidence: text("confidence").notNull().default("1.0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("evidence_household_id_uidx").on(table.householdId, table.id),
    foreignKey({
      columns: [table.householdId, table.researchRunId],
      foreignColumns: [researchRuns.householdId, researchRuns.id],
      name: "evidence_household_run_fk",
    }).onDelete("cascade"),
    check(
      "evidence_source_type_check",
      sql`${table.sourceType} IN ('government_regulator', 'exchange_official_filing', 'official_provider', 'structured_finance_api', 'reputable_publication', 'community')`,
    ),
    index("evidence_household_idx").on(table.householdId),
    index("evidence_run_idx").on(table.researchRunId),
    index("evidence_canonical_url_idx").on(table.canonicalSourceUrl),
    index("evidence_retention_idx").on(table.retentionExpiresAt),
  ],
);

export type SelectResearchRun = typeof researchRuns.$inferSelect;
export type InsertResearchRun = typeof researchRuns.$inferInsert;
export type SelectEvidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;

// --- Zod Schemas ---

export const SourceTypeSchema = z.enum(SOURCE_TYPES);

export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  researchRunId: z.string().uuid(),
  topic: z.string(),
  claim: z.string(),
  canonicalSourceUrl: z.string().url(),
  publisher: z.string(),
  sourceType: SourceTypeSchema,
  publicationTime: z.string().datetime().nullable(),
  effectiveTime: z.string().datetime().nullable(),
  retrievedAt: z.string().datetime(),
  freshnessExpiresAt: z.string().datetime(),
  contentHash: z.string(),
  supportingExcerpt: z.string(),
  confidence: z.string(),
  createdAt: z.string().datetime(),
  retentionExpiresAt: z.string().datetime(),
});

export const ResearchRunSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  userId: z.string().uuid(),
  query: z.string(),
  topic: z.string(),
  status: z.enum(RESEARCH_STATUSES),
  provider: z.string(),
  failureCode: z.string().nullable(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  retentionExpiresAt: z.string().datetime(),
});

export const CreateResearchRequestSchema = z
  .object({
    query: z.string().trim().min(1).max(500),
    topic: z.string().trim().min(1).max(100),
  })
  .strict();

export const ResearchRunParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const CreateResearchResponseDataSchema = z.object({
  run: ResearchRunSchema,
  evidence: z.array(EvidenceSchema),
});

export const CreateResearchResponseSchema = z.object({
  data: CreateResearchResponseDataSchema,
});

export const ResearchRunResponseSchema = z.object({
  data: ResearchRunSchema,
});

export const EvidenceListResponseSchema = z.object({
  data: z.array(EvidenceSchema),
});
