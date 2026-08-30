CREATE TABLE "drift_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"baseline_version_id" uuid NOT NULL,
	"mode" text DEFAULT 'lightweight' NOT NULL,
	"as_of" timestamp with time zone NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"observed_input_hash" text NOT NULL,
	"inputs" jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"failure_code" text,
	"failure_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "drift_checks_household_id_uniq" UNIQUE("household_id","id"),
	CONSTRAINT "drift_checks_mode_check" CHECK ("drift_checks"."mode" IN ('lightweight', 'deep')),
	CONSTRAINT "drift_checks_status_check" CHECK ("drift_checks"."status" IN ('queued', 'running', 'completed', 'failed')),
	CONSTRAINT "drift_checks_revision_check" CHECK ("drift_checks"."revision" >= 0),
	CONSTRAINT "drift_checks_attempts_check" CHECK ("drift_checks"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "drift_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"check_id" uuid NOT NULL,
	"baseline_version_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"policy_version" text DEFAULT 'DRIFT-IN-2026.1' NOT NULL,
	"engine_version" text DEFAULT '1.0.0' NOT NULL,
	"observed_inputs" jsonb NOT NULL,
	"observed_calculated_output" jsonb,
	"observed_output_hash" text NOT NULL,
	"deltas" jsonb,
	"created_version_id" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_expires_at" timestamp with time zone,
	CONSTRAINT "drift_events_household_id_uniq" UNIQUE("household_id","id"),
	CONSTRAINT "drift_events_status_check" CHECK ("drift_events"."status" IN ('pending', 'kept', 'accepted', 'no_change'))
);
--> statement-breakpoint
ALTER TABLE "drift_checks" ADD CONSTRAINT "drift_checks_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_checks" ADD CONSTRAINT "drift_checks_baseline_version_id_plan_versions_id_fk" FOREIGN KEY ("baseline_version_id") REFERENCES "public"."plan_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_checks" ADD CONSTRAINT "drift_checks_household_baseline_fk" FOREIGN KEY ("household_id","baseline_version_id") REFERENCES "public"."plan_versions"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_events" ADD CONSTRAINT "drift_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_events" ADD CONSTRAINT "drift_events_check_id_drift_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."drift_checks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_events" ADD CONSTRAINT "drift_events_baseline_version_id_plan_versions_id_fk" FOREIGN KEY ("baseline_version_id") REFERENCES "public"."plan_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_events" ADD CONSTRAINT "drift_events_created_version_id_plan_versions_id_fk" FOREIGN KEY ("created_version_id") REFERENCES "public"."plan_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_events" ADD CONSTRAINT "drift_events_household_check_fk" FOREIGN KEY ("household_id","check_id") REFERENCES "public"."drift_checks"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_events" ADD CONSTRAINT "drift_events_household_baseline_fk" FOREIGN KEY ("household_id","baseline_version_id") REFERENCES "public"."plan_versions"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drift_events" ADD CONSTRAINT "drift_events_household_created_version_fk" FOREIGN KEY ("household_id","created_version_id") REFERENCES "public"."plan_versions"("household_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "drift_checks_household_idempotency_uidx" ON "drift_checks" USING btree ("household_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "drift_checks_canonical_uidx" ON "drift_checks" USING btree ("household_id","baseline_version_id","mode","observed_input_hash","revision");--> statement-breakpoint
CREATE INDEX "drift_checks_household_idx" ON "drift_checks" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "drift_checks_household_created_idx" ON "drift_checks" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "drift_checks_retention_idx" ON "drift_checks" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "drift_events_check_uidx" ON "drift_events" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "drift_events_household_idx" ON "drift_events" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "drift_events_household_status_idx" ON "drift_events" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX "drift_events_household_baseline_idx" ON "drift_events" USING btree ("household_id","baseline_version_id");--> statement-breakpoint
CREATE INDEX "drift_events_household_created_idx" ON "drift_events" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "drift_events_retention_idx" ON "drift_events" USING btree ("retention_expires_at");