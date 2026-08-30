CREATE TABLE "financial_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"as_of" timestamp with time zone NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"engine_version" text DEFAULT '1.0.0' NOT NULL,
	"policy_version" text DEFAULT 'IN-2026.1' NOT NULL,
	"inputs" jsonb NOT NULL,
	"resolved_assumptions" jsonb NOT NULL,
	"completeness" jsonb NOT NULL,
	"input_hash" text NOT NULL,
	"output_hash" text NOT NULL,
	"calculated_output" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financial_snapshots_revision_check" CHECK ("financial_snapshots"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"assumptions" jsonb NOT NULL,
	"scenario_output" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_versions_version_number_positive" CHECK ("plan_versions"."version_number" >= 1)
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"baseline_version_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"overlay" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"applied_version_id" uuid,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "financial_snapshots_household_id_uidx" ON "financial_snapshots" USING btree ("household_id","id");--> statement-breakpoint
CREATE INDEX "financial_snapshots_household_idx" ON "financial_snapshots" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "financial_snapshots_household_as_of_idx" ON "financial_snapshots" USING btree ("household_id","as_of");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_household_uidx" ON "plans" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_household_id_uidx" ON "plans" USING btree ("household_id","id");--> statement-breakpoint
CREATE INDEX "plans_household_idx" ON "plans" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_versions_household_id_uidx" ON "plan_versions" USING btree ("household_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_versions_plan_version_uidx" ON "plan_versions" USING btree ("plan_id","version_number");--> statement-breakpoint
CREATE INDEX "plan_versions_plan_created_idx" ON "plan_versions" USING btree ("plan_id","created_at");--> statement-breakpoint
CREATE INDEX "plan_versions_household_created_idx" ON "plan_versions" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "plan_versions_snapshot_idx" ON "plan_versions" USING btree ("snapshot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scenarios_household_id_uidx" ON "scenarios" USING btree ("household_id","id");--> statement-breakpoint
CREATE INDEX "scenarios_household_status_idx" ON "scenarios" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX "scenarios_baseline_version_idx" ON "scenarios" USING btree ("baseline_version_id");--> statement-breakpoint
CREATE INDEX "scenarios_household_created_idx" ON "scenarios" USING btree ("household_id","created_at");--> statement-breakpoint
ALTER TABLE "financial_snapshots" ADD CONSTRAINT "financial_snapshots_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_snapshot_id_financial_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."financial_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_household_plan_fk" FOREIGN KEY ("household_id","plan_id") REFERENCES "public"."plans"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_household_snapshot_fk" FOREIGN KEY ("household_id","snapshot_id") REFERENCES "public"."financial_snapshots"("household_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_baseline_version_id_plan_versions_id_fk" FOREIGN KEY ("baseline_version_id") REFERENCES "public"."plan_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_applied_version_id_plan_versions_id_fk" FOREIGN KEY ("applied_version_id") REFERENCES "public"."plan_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_household_baseline_fk" FOREIGN KEY ("household_id","baseline_version_id") REFERENCES "public"."plan_versions"("household_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_household_applied_fk" FOREIGN KEY ("household_id","applied_version_id") REFERENCES "public"."plan_versions"("household_id","id") ON DELETE set null ON UPDATE no action;
