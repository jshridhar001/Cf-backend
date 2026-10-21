CREATE TABLE "field_irrigation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"cycle_number" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"media_urls" text[],
	"remarks" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_irrigation_cycle_per_field" UNIQUE("field_id","cycle_number"),
	CONSTRAINT "field_irrigation_cycle_number_positive" CHECK ("field_irrigation"."cycle_number" > 0),
	CONSTRAINT "field_irrigation_end_on_or_after_start" CHECK ("field_irrigation"."end_date" >= "field_irrigation"."start_date")
);
--> statement-breakpoint
ALTER TABLE "field_irrigation" ADD CONSTRAINT "field_irrigation_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_irrigation" ADD CONSTRAINT "field_irrigation_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;