CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid,
	"action" text NOT NULL,
	"actor_type" text DEFAULT 'user' NOT NULL,
	"actor_id" text,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"request_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"policy_version" text DEFAULT '2026.1' NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consent_records_purpose_check" CHECK ("consent_records"."purpose" IN ('document_storage', 'privacy_export', 'household_deletion')),
	CONSTRAINT "consent_records_action_check" CHECK ("consent_records"."action" IN ('granted', 'withdrawn'))
);
--> statement-breakpoint
CREATE TABLE "household_deletions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"confirmation_token_hash" text NOT NULL,
	"confirmation_expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"status" text DEFAULT 'pending_confirmation' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"failure_code" text,
	"failure_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"retention_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "household_deletions_status_check" CHECK ("household_deletions"."status" IN ('pending_confirmation', 'queued', 'running', 'failed', 'completed')),
	CONSTRAINT "household_deletions_attempts_check" CHECK ("household_deletions"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "privacy_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"object_key" text,
	"byte_size" integer,
	"checksum" text,
	"failure_code" text,
	"failure_message" text,
	"expires_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"retention_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "privacy_exports_status_check" CHECK ("privacy_exports"."status" IN ('queued', 'running', 'completed', 'failed', 'expired')),
	CONSTRAINT "privacy_exports_attempts_check" CHECK ("privacy_exports"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"uploader_user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"media_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"checksum" text NOT NULL,
	"object_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"retention_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_status_check" CHECK ("documents"."status" IN ('pending', 'available', 'delete_pending', 'deleted', 'failed')),
	CONSTRAINT "documents_byte_size_check" CHECK ("documents"."byte_size" >= 0)
);
--> statement-breakpoint
ALTER TABLE "privacy_exports" ADD CONSTRAINT "privacy_exports_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_exports" ADD CONSTRAINT "privacy_exports_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploader_user_id_users_id_fk" FOREIGN KEY ("uploader_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_household_idx" ON "audit_events" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "audit_events_action_idx" ON "audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_events_created_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "consent_records_household_idempotency_uidx" ON "consent_records" USING btree ("household_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "consent_records_lookup_idx" ON "consent_records" USING btree ("household_id","user_id","purpose","created_at");--> statement-breakpoint
CREATE INDEX "consent_records_created_idx" ON "consent_records" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "household_deletions_household_idempotency_uidx" ON "household_deletions" USING btree ("household_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "household_deletions_household_idx" ON "household_deletions" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "household_deletions_status_idx" ON "household_deletions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "household_deletions_retention_idx" ON "household_deletions" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "privacy_exports_household_idempotency_uidx" ON "privacy_exports" USING btree ("household_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "privacy_exports_household_idx" ON "privacy_exports" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "privacy_exports_status_idx" ON "privacy_exports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "privacy_exports_expires_idx" ON "privacy_exports" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "privacy_exports_retention_idx" ON "privacy_exports" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_object_key_uidx" ON "documents" USING btree ("object_key");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_household_id_uidx" ON "documents" USING btree ("household_id","id");--> statement-breakpoint
CREATE INDEX "documents_household_idx" ON "documents" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "documents_household_status_idx" ON "documents" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX "documents_household_created_idx" ON "documents" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "documents_retention_idx" ON "documents" USING btree ("retention_expires_at");