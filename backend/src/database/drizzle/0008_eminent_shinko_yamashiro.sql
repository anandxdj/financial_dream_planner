CREATE TABLE "planner_message_citations" (
	"household_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planner_message_citations" ADD CONSTRAINT "planner_message_citations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_message_citations" ADD CONSTRAINT "planner_message_citations_message_id_planner_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."planner_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_message_citations" ADD CONSTRAINT "planner_message_citations_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_message_citations" ADD CONSTRAINT "planner_message_citations_household_message_fk" FOREIGN KEY ("household_id","message_id") REFERENCES "public"."planner_messages"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_message_citations" ADD CONSTRAINT "planner_message_citations_household_evidence_fk" FOREIGN KEY ("household_id","evidence_id") REFERENCES "public"."evidence"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "planner_message_citations_message_evidence_uidx" ON "planner_message_citations" USING btree ("message_id","evidence_id");--> statement-breakpoint
CREATE INDEX "planner_message_citations_evidence_idx" ON "planner_message_citations" USING btree ("evidence_id");