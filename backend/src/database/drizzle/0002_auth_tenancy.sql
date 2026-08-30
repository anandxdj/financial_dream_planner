ALTER TYPE "public"."identity_provider" ADD VALUE IF NOT EXISTS 'oidc';--> statement-breakpoint
ALTER TYPE "public"."challenge_type" ADD VALUE IF NOT EXISTS 'oidc_transaction';--> statement-breakpoint
ALTER TYPE "public"."challenge_type" ADD VALUE IF NOT EXISTS 'oidc_bridge';--> statement-breakpoint
CREATE TYPE "public"."household_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TABLE "households" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "household_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "household_id" uuid NOT NULL REFERENCES "public"."households"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
  "role" "household_role" DEFAULT 'owner' NOT NULL,
  "is_primary" boolean DEFAULT true NOT NULL,
  "active_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ended_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
INSERT INTO "households" ("id", "name") SELECT "id", "display_name" || '''s household' FROM "users" ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "household_members" ("household_id", "user_id", "role", "is_primary") SELECT "id", "id", 'owner', true FROM "users";--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_active_user_uidx" ON "household_members" ("user_id") WHERE "ended_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_primary_uidx" ON "household_members" ("household_id") WHERE "ended_at" IS NULL AND "is_primary" = true;--> statement-breakpoint
CREATE INDEX "household_members_household_idx" ON "household_members" ("household_id");--> statement-breakpoint
CREATE TABLE "session_families" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
  "household_id" uuid NOT NULL REFERENCES "public"."households"("id") ON DELETE cascade,
  "auth_method" text NOT NULL,
  "authenticated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "revoked_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
INSERT INTO "session_families" ("id", "user_id", "household_id", "auth_method", "expires_at", "revoked_at", "revoked_reason", "created_at")
SELECT DISTINCT ON ("family_id") "family_id", "user_id", "user_id", 'legacy', "expires_at", "revoked_at", "revoked_reason"::text, "created_at" FROM "sessions" ORDER BY "family_id", "expires_at" DESC;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_family_id_session_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."session_families"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX "session_families_user_active_idx" ON "session_families" ("user_id", "revoked_at");--> statement-breakpoint
CREATE TABLE "auth_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "token_hash" text,
  "expires_at" timestamp with time zone,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "auth_invitations_email_uidx" ON "auth_invitations" (lower("email"));--> statement-breakpoint
CREATE INDEX "auth_invitations_token_idx" ON "auth_invitations" ("token_hash");--> statement-breakpoint
ALTER TABLE "auth_identities" ADD COLUMN "issuer" text;--> statement-breakpoint
ALTER TABLE "auth_identities" ADD COLUMN "subject" text;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_issuer_subject_uidx" ON "auth_identities" ("issuer", "subject") WHERE "issuer" IS NOT NULL AND "subject" IS NOT NULL;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "users" GROUP BY lower("email") HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'U2 migration aborted: users contain case-insensitive email collisions; resolve duplicate lower(email) values before retrying';
  END IF;
END $$;--> statement-breakpoint
DROP INDEX IF EXISTS "users_email_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_uidx" ON "users" (lower("email"));
