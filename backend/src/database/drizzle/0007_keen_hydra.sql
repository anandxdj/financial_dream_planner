CREATE TABLE "planner_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "planner_conversations_household_id_uniq" UNIQUE("household_id","id"),
	CONSTRAINT "planner_conversations_status_check" CHECK ("planner_conversations"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "planner_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"sequence_number" integer NOT NULL,
	"citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "planner_messages_sender_check" CHECK ("planner_messages"."sender" IN ('user', 'assistant')),
	CONSTRAINT "planner_messages_seq_positive" CHECK ("planner_messages"."sequence_number" >= 1)
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"research_run_id" uuid NOT NULL,
	"topic" text NOT NULL,
	"claim" text NOT NULL,
	"canonical_source_url" text NOT NULL,
	"publisher" text NOT NULL,
	"source_type" text NOT NULL,
	"publication_time" timestamp with time zone,
	"effective_time" timestamp with time zone,
	"retrieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"freshness_expires_at" timestamp with time zone NOT NULL,
	"content_hash" text NOT NULL,
	"supporting_excerpt" text NOT NULL,
	"confidence" text DEFAULT '1.0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "evidence_source_type_check" CHECK ("evidence"."source_type" IN ('government_regulator', 'exchange_official_filing', 'official_provider', 'structured_finance_api', 'reputable_publication', 'community'))
);
--> statement-breakpoint
CREATE TABLE "research_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"topic" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"provider" text DEFAULT 'tavily' NOT NULL,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"retention_expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "research_runs_household_id_uniq" UNIQUE("household_id","id"),
	CONSTRAINT "research_runs_status_check" CHECK ("research_runs"."status" IN ('queued', 'running', 'completed', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "planner_conversations" ADD CONSTRAINT "planner_conversations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_conversations" ADD CONSTRAINT "planner_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_messages" ADD CONSTRAINT "planner_messages_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_messages" ADD CONSTRAINT "planner_messages_conversation_id_planner_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."planner_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_messages" ADD CONSTRAINT "planner_messages_household_conv_fk" FOREIGN KEY ("household_id","conversation_id") REFERENCES "public"."planner_conversations"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_research_run_id_research_runs_id_fk" FOREIGN KEY ("research_run_id") REFERENCES "public"."research_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_household_run_fk" FOREIGN KEY ("household_id","research_run_id") REFERENCES "public"."research_runs"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planner_conversations_household_idx" ON "planner_conversations" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "planner_conversations_household_created_idx" ON "planner_conversations" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "planner_conversations_retention_idx" ON "planner_conversations" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "planner_messages_household_id_uidx" ON "planner_messages" USING btree ("household_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "planner_messages_conv_seq_uidx" ON "planner_messages" USING btree ("conversation_id","sequence_number");--> statement-breakpoint
CREATE INDEX "planner_messages_conv_created_idx" ON "planner_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "planner_messages_household_created_idx" ON "planner_messages" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "planner_messages_retention_idx" ON "planner_messages" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "evidence_household_id_uidx" ON "evidence" USING btree ("household_id","id");--> statement-breakpoint
CREATE INDEX "evidence_household_idx" ON "evidence" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "evidence_run_idx" ON "evidence" USING btree ("research_run_id");--> statement-breakpoint
CREATE INDEX "evidence_canonical_url_idx" ON "evidence" USING btree ("canonical_source_url");--> statement-breakpoint
CREATE INDEX "evidence_retention_idx" ON "evidence" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE INDEX "research_runs_household_idx" ON "research_runs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "research_runs_household_created_idx" ON "research_runs" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "research_runs_retention_idx" ON "research_runs" USING btree ("retention_expires_at");