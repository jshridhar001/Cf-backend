CREATE TABLE "field_dehaulming" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"media_urls" text[],
	"remarks" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "field_dehaulming_end_on_or_after_start" CHECK ("field_dehaulming"."end_date" >= "field_dehaulming"."start_date")
);
--> statement-breakpoint
ALTER TABLE "field_dehaulming" ADD CONSTRAINT "field_dehaulming_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_dehaulming" ADD CONSTRAINT "field_dehaulming_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_dehaulming_field_start_idx" ON "field_dehaulming" USING btree ("field_id","start_date");