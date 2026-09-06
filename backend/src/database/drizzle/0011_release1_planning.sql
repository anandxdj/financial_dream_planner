CREATE TABLE "household_planning" (
	"household_id" uuid PRIMARY KEY NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_step" integer DEFAULT 0 NOT NULL,
	"estimates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "household_planning_revision_check" CHECK ("household_planning"."revision" >= 0),
	CONSTRAINT "household_planning_completed_step_check" CHECK ("household_planning"."completed_step" between 0 and 3)
);
--> statement-breakpoint
CREATE TABLE "plan_generation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"revision" integer NOT NULL,
	"plan_id" uuid,
	"plan_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_generation_revision_check" CHECK ("plan_generation_requests"."revision" >= 0),
	CONSTRAINT "plan_generation_result_pair_check" CHECK (("plan_generation_requests"."plan_id" is null and "plan_generation_requests"."plan_version_id" is null) or ("plan_generation_requests"."plan_id" is not null and "plan_generation_requests"."plan_version_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "planning_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_step" integer DEFAULT 0 NOT NULL,
	"estimates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"claimed_household_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "planning_drafts_revision_check" CHECK ("planning_drafts"."revision" >= 0),
	CONSTRAINT "planning_drafts_completed_step_check" CHECK ("planning_drafts"."completed_step" between 0 and 3)
);
--> statement-breakpoint
CREATE TABLE "planning_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"target_amount" numeric(19, 4) NOT NULL,
	"current_savings" numeric(19, 4) NOT NULL,
	"monthly_contribution" numeric(19, 4) NOT NULL,
	"target_date" text NOT NULL,
	"horizon_months" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "planning_goals_category_check" CHECK ("planning_goals"."category" in ('home','car','travel','savings','education','medical','retirement','custom')),
	CONSTRAINT "planning_goals_status_check" CHECK ("planning_goals"."status" in ('active','archived')),
	CONSTRAINT "planning_goals_amounts_check" CHECK ("planning_goals"."target_amount" >= 0 and "planning_goals"."current_savings" >= 0 and "planning_goals"."monthly_contribution" >= 0 and "planning_goals"."horizon_months" > 0)
);
--> statement-breakpoint
ALTER TABLE "household_planning" ADD CONSTRAINT "household_planning_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_planning" ADD CONSTRAINT "household_planning_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_generation_requests" ADD CONSTRAINT "plan_generation_requests_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_generation_requests" ADD CONSTRAINT "plan_generation_household_plan_fk" FOREIGN KEY ("household_id","plan_id") REFERENCES "public"."plans"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_generation_requests" ADD CONSTRAINT "plan_generation_household_version_fk" FOREIGN KEY ("household_id","plan_version_id") REFERENCES "public"."plan_versions"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_drafts" ADD CONSTRAINT "planning_drafts_claimed_household_id_households_id_fk" FOREIGN KEY ("claimed_household_id") REFERENCES "public"."households"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_goals" ADD CONSTRAINT "planning_goals_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plan_generation_household_key_uidx" ON "plan_generation_requests" USING btree ("household_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "planning_drafts_token_hash_uidx" ON "planning_drafts" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "planning_drafts_expiry_idx" ON "planning_drafts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "planning_goals_household_idx" ON "planning_goals" USING btree ("household_id");