CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'other' NOT NULL,
	"original_principal" numeric(19, 4),
	"outstanding_principal" numeric(19, 4) NOT NULL,
	"interest_rate" numeric(7, 4),
	"remaining_tenure_months" integer,
	"monthly_emi" numeric(19, 4),
	"next_due_date" text,
	"lender_name" text,
	"account_id" uuid,
	"prepayments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loans_type_check" CHECK ("loans"."type" in ('home','car','personal','education','credit_card','other')),
	CONSTRAINT "loans_status_check" CHECK ("loans"."status" in ('active','closed','archived')),
	CONSTRAINT "loans_outstanding_principal_check" CHECK ("loans"."outstanding_principal" >= 0),
	CONSTRAINT "loans_revision_check" CHECK ("loans"."revision" >= 0)
);
--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "loans_household_id_uidx" ON "loans" USING btree ("household_id","id");--> statement-breakpoint
CREATE INDEX "loans_household_idx" ON "loans" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "loans_household_status_idx" ON "loans" USING btree ("household_id","status");--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_revision_check" CHECK ("scenarios"."revision" >= 0);