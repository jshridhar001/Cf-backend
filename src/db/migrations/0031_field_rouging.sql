CREATE TABLE "field_rouging" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"virus_infected_plants_removed" numeric(13, 3),
	"off_variety_type_removal" numeric(13, 3),
	"media_urls" text[],
	"remarks" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "field_rouging_virus_nonnegative" CHECK ("field_rouging"."virus_infected_plants_removed" IS NULL OR "field_rouging"."virus_infected_plants_removed" >= 0),
	CONSTRAINT "field_rouging_off_variety_nonnegative" CHECK ("field_rouging"."off_variety_type_removal" IS NULL OR "field_rouging"."off_variety_type_removal" >= 0),
	CONSTRAINT "field_rouging_end_on_or_after_start" CHECK ("field_rouging"."end_date" >= "field_rouging"."start_date")
);
--> statement-breakpoint
ALTER TABLE "field_rouging" ADD CONSTRAINT "field_rouging_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_rouging" ADD CONSTRAINT "field_rouging_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_rouging_field_start_idx" ON "field_rouging" USING btree ("field_id","start_date");