import { index, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { households } from "../households/model";

export const accountTypeEnum = pgEnum("account_type", [
  "SAVINGS",
  "CURRENT",
  "CREDIT_CARD",
  "WALLET",
  "BROKERAGE",
  "LOAN",
  "CASH",
  "OTHER",
]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull().default("SAVINGS"),
  currency: text("currency").notNull().default("INR"),
  institutionName: text("institution_name"),
  maskedNumber: text("masked_number"),
  currentBalance: numeric("current_balance", { precision: 19, scale: 4 }),
  balanceUpdatedAt: timestamp("balance_updated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("accounts_household_id_uidx").on(table.householdId, table.id),
  index("accounts_household_idx").on(table.householdId),
]);

export type SelectAccount = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;
