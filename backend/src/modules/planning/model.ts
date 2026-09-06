import { sql } from "drizzle-orm";
import { check, foreignKey, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";
import { households } from "../households/model";
import { users } from "../../database/models/user";
import { ScenarioDomainInputsSchema } from "../financial-engine/model";
import { plans, planVersions } from "../plans/model";

export const planningInputsSchema = ScenarioDomainInputsSchema;
export type PlanningInputs = z.infer<typeof planningInputsSchema>;
export const money = z.string().trim().regex(/^\d+(?:\.\d+)?$/);
export const affordabilitySchema = z.object({ purchaseAmount: money, income: money, expenses: money, liquidSavings: money.optional(), bufferMonths: z.number().int().min(0).max(120).default(3) }).strict();
export const goalCategory = z.enum(["home", "car", "travel", "savings", "education", "medical", "retirement", "custom"]);
export const goalSchema = z.object({ name: z.string().trim().min(1).max(100), category: goalCategory, targetAmount: money, currentSavings: money, monthlyContribution: money, targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => { const d = new Date(`${v}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v; }, "targetDate must be a valid calendar date") }).strict();
export const planningEstimateSchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)*$/);
export const planningMetadataSchema = z.object({ inputs: planningInputsSchema, completedStep: z.number().int().min(0).max(3), estimates: z.array(planningEstimateSchema).max(100) }).strict();

export const planningDrafts = pgTable("planning_drafts", {
  id: uuid("id").primaryKey().defaultRandom(), tokenHash: text("token_hash").notNull(), inputs: jsonb("inputs").$type<PlanningInputs>().notNull().default({}), completedStep: integer("completed_step").notNull().default(0), estimates: jsonb("estimates").$type<string[]>().notNull().default([]), revision: integer("revision").notNull().default(0), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), claimedHouseholdId: uuid("claimed_household_id").references(() => households.id, { onDelete: "set null" }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("planning_drafts_token_hash_uidx").on(t.tokenHash), index("planning_drafts_expiry_idx").on(t.expiresAt), check("planning_drafts_revision_check", sql`${t.revision} >= 0`), check("planning_drafts_completed_step_check", sql`${t.completedStep} between 0 and 3`)]);

export const householdPlanning = pgTable("household_planning", {
  householdId: uuid("household_id").primaryKey().references(() => households.id, { onDelete: "cascade" }), inputs: jsonb("inputs").$type<PlanningInputs>().notNull().default({}), completedStep: integer("completed_step").notNull().default(0), estimates: jsonb("estimates").$type<string[]>().notNull().default([]), revision: integer("revision").notNull().default(0), updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [check("household_planning_revision_check", sql`${t.revision} >= 0`), check("household_planning_completed_step_check", sql`${t.completedStep} between 0 and 3`)]);

export const planningGoals = pgTable("planning_goals", {
  id: uuid("id").primaryKey().defaultRandom(), householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }), name: text("name").notNull(), category: text("category").notNull(), targetAmount: numeric("target_amount", { precision: 19, scale: 4 }).notNull(), currentSavings: numeric("current_savings", { precision: 19, scale: 4 }).notNull(), monthlyContribution: numeric("monthly_contribution", { precision: 19, scale: 4 }).notNull(), targetDate: text("target_date").notNull(), horizonMonths: integer("horizon_months").notNull(), status: text("status").notNull().default("active"), revision: integer("revision").notNull().default(0), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("planning_goals_household_idx").on(t.householdId), check("planning_goals_category_check", sql`${t.category} in ('home','car','travel','savings','education','medical','retirement','custom')`), check("planning_goals_status_check", sql`${t.status} in ('active','archived')`), check("planning_goals_amounts_check", sql`${t.targetAmount} >= 0 and ${t.currentSavings} >= 0 and ${t.monthlyContribution} >= 0 and ${t.horizonMonths} > 0`)]);

export const planGenerationRequests = pgTable("plan_generation_requests", {
  id: uuid("id").primaryKey().defaultRandom(), householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }), idempotencyKey: text("idempotency_key").notNull(), revision: integer("revision").notNull(), planId: uuid("plan_id"), planVersionId: uuid("plan_version_id"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("plan_generation_household_key_uidx").on(t.householdId, t.idempotencyKey),
  check("plan_generation_revision_check", sql`${t.revision} >= 0`),
  check("plan_generation_result_pair_check", sql`(${t.planId} is null and ${t.planVersionId} is null) or (${t.planId} is not null and ${t.planVersionId} is not null)`),
  foreignKey({ columns: [t.householdId, t.planId], foreignColumns: [plans.householdId, plans.id], name: "plan_generation_household_plan_fk" }).onDelete("cascade"),
  foreignKey({ columns: [t.householdId, t.planVersionId], foreignColumns: [planVersions.householdId, planVersions.id], name: "plan_generation_household_version_fk" }).onDelete("cascade"),
]);

export type PlanningDraft = typeof planningDrafts.$inferSelect;
export type HouseholdPlanning = typeof householdPlanning.$inferSelect;
export type PlanningGoal = typeof planningGoals.$inferSelect;
