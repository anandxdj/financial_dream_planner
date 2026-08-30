import { sql } from "drizzle-orm";
import { check, foreignKey, index, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { accounts } from "../accounts/model";
import { categories } from "../categories/model";
import { households } from "../households/model";

export const transactionDirectionEnum = pgEnum("transaction_direction", [
  "DEBIT",
  "CREDIT",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "verified",
  "needs_review",
  "pending",
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  accountId: uuid("account_id"),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
  currency: text("currency").notNull().default("INR"),
  direction: transactionDirectionEnum("direction").notNull(),
  merchantName: text("merchant_name"),
  merchantNormalized: text("merchant_normalized"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  paymentMethod: text("payment_method"),
  description: text("description"),
  externalReference: text("external_reference"),
  status: transactionStatusEnum("status").notNull().default("verified"),
  parserConfidence: numeric("parser_confidence", { precision: 5, scale: 4 }),
  fallbackFingerprint: text("fallback_fingerprint"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  foreignKey({ columns: [table.householdId, table.accountId], foreignColumns: [accounts.householdId, accounts.id], name: "transactions_household_account_fk" }).onDelete("restrict"),
  uniqueIndex("transactions_household_id_uidx").on(table.householdId, table.id),
  uniqueIndex("transactions_household_ref_uidx").on(table.householdId, table.externalReference).where(sql`${table.externalReference} is not null`),
  check("transactions_amount_positive", sql`${table.amount} > 0`),
  check("transactions_parser_confidence_range", sql`${table.parserConfidence} is null or (${table.parserConfidence} >= 0 and ${table.parserConfidence} <= 1)`),
  index("transactions_household_occurred_idx").on(table.householdId, table.occurredAt),
  index("transactions_household_account_idx").on(table.householdId, table.accountId),
  index("transactions_household_fingerprint_idx").on(table.householdId, table.fallbackFingerprint),
]);

export const transactionSources = pgTable("transaction_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  transactionId: uuid("transaction_id").notNull(),
  sourceType: text("source_type").notNull().default("SMS"),
  clientId: text("client_id"),
  externalReference: text("external_reference"),
  sourceMetadataJson: jsonb("source_metadata_json").$type<Record<string, unknown> | null>(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  foreignKey({ columns: [table.householdId, table.transactionId], foreignColumns: [transactions.householdId, transactions.id], name: "transaction_sources_household_transaction_fk" }).onDelete("cascade"),
  uniqueIndex("transaction_sources_household_client_uidx").on(table.householdId, table.sourceType, table.clientId).where(sql`${table.clientId} is not null`),
  check("transaction_sources_confidence_range", sql`${table.confidence} is null or (${table.confidence} >= 0 and ${table.confidence} <= 1)`),
  index("transaction_sources_transaction_idx").on(table.transactionId),
  index("transaction_sources_household_idx").on(table.householdId),
]);

export type SelectTransaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type SelectTransactionSource = typeof transactionSources.$inferSelect;
export type InsertTransactionSource = typeof transactionSources.$inferInsert;
