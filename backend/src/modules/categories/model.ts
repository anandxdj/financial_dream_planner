import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { households } from "../households/model";

export const categoryTypeEnum = pgEnum("category_type", [
  "EXPENSE",
  "INCOME",
  "TRANSFER",
  "OTHER",
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug"),
  categoryType: categoryTypeEnum("category_type").notNull().default("EXPENSE"),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("categories_household_id_uidx").on(table.householdId, table.id),
  index("categories_household_idx").on(table.householdId),
]);

export type SelectCategory = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
