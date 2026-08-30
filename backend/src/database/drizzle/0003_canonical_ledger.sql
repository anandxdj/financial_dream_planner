CREATE TYPE "public"."account_type" AS ENUM('SAVINGS', 'CURRENT', 'CREDIT_CARD', 'WALLET', 'BROKERAGE', 'LOAN', 'CASH', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('EXPENSE', 'INCOME', 'TRANSFER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."transaction_direction" AS ENUM('DEBIT', 'CREDIT');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('verified', 'needs_review', 'pending');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" DEFAULT 'SAVINGS' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"institution_name" text,
	"masked_number" text,
	"current_balance" numeric(19, 4),
	"balance_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid,
	"name" text NOT NULL,
	"slug" text,
	"category_type" "category_type" DEFAULT 'EXPENSE' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"source_type" text DEFAULT 'SMS' NOT NULL,
	"client_id" text,
	"external_reference" text,
	"source_metadata_json" jsonb,
	"confidence" numeric(5, 4),
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"account_id" uuid,
	"category_id" uuid,
	"amount" numeric(19, 4) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"direction" "transaction_direction" NOT NULL,
	"merchant_name" text,
	"merchant_normalized" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"payment_method" text,
	"description" text,
	"external_reference" text,
	"status" "transaction_status" DEFAULT 'verified' NOT NULL,
	"parser_confidence" numeric(5, 4),
	"fallback_fingerprint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_sources" ADD CONSTRAINT "transaction_sources_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_sources" ADD CONSTRAINT "transaction_sources_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_household_idx" ON "accounts" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "categories_household_idx" ON "categories" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_sources_household_ref_uidx" ON "transaction_sources" USING btree ("household_id","external_reference") WHERE "transaction_sources"."external_reference" is not null;--> statement-breakpoint
CREATE INDEX "transaction_sources_transaction_idx" ON "transaction_sources" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_sources_household_idx" ON "transaction_sources" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "transactions_household_occurred_idx" ON "transactions" USING btree ("household_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transactions_household_account_idx" ON "transactions" USING btree ("household_id","account_id");--> statement-breakpoint
CREATE INDEX "transactions_household_fingerprint_idx" ON "transactions" USING btree ("household_id","fallback_fingerprint");