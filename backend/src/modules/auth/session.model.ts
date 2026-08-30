import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../../database/models/user";
import { households } from "../households/model";

export const sessionFamilies = pgTable("session_families", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  authMethod: text("auth_method").notNull(),
  authenticatedAt: timestamp("authenticated_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedReason: text("revoked_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("session_families_user_active_idx").on(table.userId, table.revokedAt)]);
