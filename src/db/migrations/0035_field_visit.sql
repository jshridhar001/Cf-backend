CREATE TABLE "field_visit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"observations" text NOT NULL,
	"media_urls" text[],
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "field_visit_end_on_or_after_start" CHECK ("field_visit"."end_date" >= "field_visit"."start_date")
);
--> statement-breakpoint
ALTER TABLE "field_visit" ADD CONSTRAINT "field_visit_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_visit" ADD CONSTRAINT "field_visit_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_visit_field_start_idx" ON "field_visit" USING btree ("field_id","start_date");