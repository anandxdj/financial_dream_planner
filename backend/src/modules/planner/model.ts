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
import { users } from "../../database/models/user";
import { evidence, SourceTypeSchema } from "../research/model";

extendZodWithOpenApi(z);

export const PLANNER_CONVERSATION_STATUSES = ["active", "archived"] as const;
export type PlannerConversationStatus = (typeof PLANNER_CONVERSATION_STATUSES)[number];

export const PLANNER_MESSAGE_SENDERS = ["user", "assistant"] as const;
export type PlannerMessageSender = (typeof PLANNER_MESSAGE_SENDERS)[number];

// --- Citation Schema ---
export const CitationSchema = z.object({
  evidenceId: z.string().uuid(),
  topic: z.string(),
  claim: z.string(),
  canonicalSourceUrl: z.string().url(),
  publisher: z.string(),
  sourceType: SourceTypeSchema,
  supportingExcerpt: z.string(),
  retrievedAt: z.string().datetime(),
  freshnessExpiresAt: z.string().datetime(),
});

export type Citation = z.infer<typeof CitationSchema>;

// --- Planner Conversations Table ---
export const plannerConversations = pgTable(
  "planner_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("planner_conversations_household_id_uniq").on(table.householdId, table.id),
    check(
      "planner_conversations_status_check",
      sql`${table.status} IN ('active', 'archived')`,
    ),
    index("planner_conversations_household_idx").on(table.householdId),
    index("planner_conversations_household_created_idx").on(table.householdId, table.createdAt),
    index("planner_conversations_retention_idx").on(table.retentionExpiresAt),
  ],
);

// --- Planner Messages Table ---
export const plannerMessages = pgTable(
  "planner_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => plannerConversations.id, { onDelete: "cascade" }),
    sender: text("sender").notNull(),
    content: text("content").notNull(),
    sequenceNumber: integer("sequence_number").notNull(),
    citations: jsonb("citations").$type<Citation[]>().notNull().default([]),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("planner_messages_household_id_uidx").on(table.householdId, table.id),
    uniqueIndex("planner_messages_conv_seq_uidx").on(table.conversationId, table.sequenceNumber),
    foreignKey({
      columns: [table.householdId, table.conversationId],
      foreignColumns: [plannerConversations.householdId, plannerConversations.id],
      name: "planner_messages_household_conv_fk",
    }).onDelete("cascade"),
    check("planner_messages_sender_check", sql`${table.sender} IN ('user', 'assistant')`),
    check("planner_messages_seq_positive", sql`${table.sequenceNumber} >= 1`),
    index("planner_messages_conv_created_idx").on(table.conversationId, table.createdAt),
    index("planner_messages_household_created_idx").on(table.householdId, table.createdAt),
    index("planner_messages_retention_idx").on(table.retentionExpiresAt),
  ],
);

export const plannerMessageCitations = pgTable(
  "planner_message_citations",
  {
    householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").notNull().references(() => plannerMessages.id, { onDelete: "cascade" }),
    evidenceId: uuid("evidence_id").notNull().references(() => evidence.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("planner_message_citations_message_evidence_uidx").on(table.messageId, table.evidenceId),
    foreignKey({
      columns: [table.householdId, table.messageId],
      foreignColumns: [plannerMessages.householdId, plannerMessages.id],
      name: "planner_message_citations_household_message_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.householdId, table.evidenceId],
      foreignColumns: [evidence.householdId, evidence.id],
      name: "planner_message_citations_household_evidence_fk",
    }).onDelete("cascade"),
    index("planner_message_citations_evidence_idx").on(table.evidenceId),
  ],
);

export type SelectPlannerConversation = typeof plannerConversations.$inferSelect;
export type InsertPlannerConversation = typeof plannerConversations.$inferInsert;
export type SelectPlannerMessage = typeof plannerMessages.$inferSelect;
export type InsertPlannerMessage = typeof plannerMessages.$inferInsert;

// --- Zod Schemas ---

export const PlannerConversationSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  status: z.enum(PLANNER_CONVERSATION_STATUSES),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  retentionExpiresAt: z.string().datetime(),
});

export const PlannerMessageSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  conversationId: z.string().uuid(),
  sender: z.enum(PLANNER_MESSAGE_SENDERS),
  content: z.string(),
  sequenceNumber: z.number().int().min(1),
  citations: z.array(CitationSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  retentionExpiresAt: z.string().datetime(),
});

export const PlannerChatRequestSchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    message: z.string().trim().min(1).max(4000),
  })
  .strict();

export const PlannerChatResponseDataSchema = z.object({
  conversationId: z.string().uuid(),
  message: PlannerMessageSchema,
});

export const PlannerChatResponseSchema = z.object({
  data: PlannerChatResponseDataSchema,
});

export const PlannerAnalyzeRequestSchema = z
  .object({
    conversationId: z.string().uuid().optional(),
  })
  .strict();

export const PlannerConversationsResponseSchema = z.object({
  data: z.array(PlannerConversationSchema),
  nextCursor: z.string().optional(),
});

export const PlannerMessagesResponseSchema = z.object({
  data: z.array(PlannerMessageSchema),
});

export const PlannerConversationListQuerySchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).strict();

export const PlannerConversationParamsSchema = z.object({ id: z.string().uuid() }).strict();
