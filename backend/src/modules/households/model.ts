import { sql } from "drizzle-orm";
import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { HOUSEHOLD_ROLE } from "../../database/constants";
import { users } from "../../database/models/user";

export const householdRoleEnum = pgEnum("household_role", [HOUSEHOLD_ROLE.owner, HOUSEHOLD_ROLE.member]);

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const householdMembers = pgTable("household_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: householdRoleEnum("role").notNull().default(HOUSEHOLD_ROLE.owner),
  isPrimary: boolean("is_primary").notNull().default(true),
  activeAt: timestamp("active_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("household_members_active_user_uidx").on(table.userId).where(sql`${table.endedAt} is null`),
  uniqueIndex("household_members_primary_uidx").on(table.householdId).where(sql`${table.endedAt} is null and ${table.isPrimary} = true`),
  index("household_members_household_idx").on(table.householdId),
]);

export type SelectHouseholdMember = typeof householdMembers.$inferSelect;
