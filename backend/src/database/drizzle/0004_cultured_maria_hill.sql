ALTER TABLE "transaction_sources" DROP CONSTRAINT "transaction_sources_transaction_id_transactions_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_account_id_accounts_id_fk";
--> statement-breakpoint
DROP INDEX "transaction_sources_household_ref_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_household_id_uidx" ON "accounts" USING btree ("household_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_household_id_uidx" ON "categories" USING btree ("household_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_household_id_uidx" ON "transactions" USING btree ("household_id","id");--> statement-breakpoint
ALTER TABLE "transaction_sources" ADD CONSTRAINT "transaction_sources_household_transaction_fk" FOREIGN KEY ("household_id","transaction_id") REFERENCES "public"."transactions"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_household_account_fk" FOREIGN KEY ("household_id","account_id") REFERENCES "public"."accounts"("household_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_sources_household_client_uidx" ON "transaction_sources" USING btree ("household_id","source_type","client_id") WHERE "transaction_sources"."client_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_household_ref_uidx" ON "transactions" USING btree ("household_id","external_reference") WHERE "transactions"."external_reference" is not null;--> statement-breakpoint
ALTER TABLE "transaction_sources" ADD CONSTRAINT "transaction_sources_confidence_range" CHECK ("transaction_sources"."confidence" is null or ("transaction_sources"."confidence" >= 0 and "transaction_sources"."confidence" <= 1));--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_amount_positive" CHECK ("transactions"."amount" > 0);--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_parser_confidence_range" CHECK ("transactions"."parser_confidence" is null or ("transactions"."parser_confidence" >= 0 and "transactions"."parser_confidence" <= 1));
