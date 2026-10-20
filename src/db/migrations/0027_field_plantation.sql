CREATE TABLE "field_plantation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"variety_id" uuid NOT NULL,
	"size_id" uuid NOT NULL,
	"bag_count" integer NOT NULL,
	"acres_planted" numeric(10, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"requisition_id" uuid,
	"geo_location" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_plantation_id_field" UNIQUE("id","field_id"),
	CONSTRAINT "field_plantation_bag_count_positive" CHECK ("field_plantation"."bag_count" > 0),
	CONSTRAINT "field_plantation_acres_planted_positive" CHECK ("field_plantation"."acres_planted" > 0),
	CONSTRAINT "field_plantation_end_on_or_after_start" CHECK ("field_plantation"."end_date" IS NULL OR "field_plantation"."end_date" >= "field_plantation"."start_date")
);
--> statement-breakpoint
ALTER TABLE "field_plantation" ADD CONSTRAINT "field_plantation_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_plantation" ADD CONSTRAINT "field_plantation_variety_id_variety_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."variety"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_plantation" ADD CONSTRAINT "field_plantation_size_id_seed_size_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."seed_size"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_plantation" ADD CONSTRAINT "field_plantation_requisition_id_seed_requisition_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."seed_requisition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_plantation" ADD CONSTRAINT "field_plantation_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_plantation_field_start_idx" ON "field_plantation" USING btree ("field_id","start_date");