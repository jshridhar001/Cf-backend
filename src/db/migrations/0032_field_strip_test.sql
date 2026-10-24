CREATE TYPE "public"."strip_test_type" AS ENUM('PRE_DEHAULMING', 'POST_DEHAULMING');--> statement-breakpoint
CREATE TABLE "field_strip_test_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "field_strip_test_group_id_field" UNIQUE("id","field_id")
);
--> statement-breakpoint
CREATE TABLE "field_strip_test_tuber" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strip_test_id" uuid NOT NULL,
	"tuber_size_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"weight_kg" numeric(13, 3) NOT NULL,
	CONSTRAINT "field_strip_test_tuber_size_key" UNIQUE("strip_test_id","tuber_size_id"),
	CONSTRAINT "field_strip_test_tuber_quantity_nonnegative" CHECK ("field_strip_test_tuber"."quantity" >= 0),
	CONSTRAINT "field_strip_test_tuber_weight_nonnegative" CHECK ("field_strip_test_tuber"."weight_kg" >= 0)
);
--> statement-breakpoint
CREATE TABLE "field_strip_test" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"type" "strip_test_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"strip_length" numeric(13, 3) NOT NULL,
	"strip_width" numeric(13, 3) NOT NULL,
	"number_of_plants" integer NOT NULL,
	"stems_per_plant" integer,
	"media_urls" text[],
	"remarks" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "field_strip_test_end_on_or_after_start" CHECK ("field_strip_test"."end_date" >= "field_strip_test"."start_date"),
	CONSTRAINT "field_strip_test_strip_length_positive" CHECK ("field_strip_test"."strip_length" > 0),
	CONSTRAINT "field_strip_test_strip_width_positive" CHECK ("field_strip_test"."strip_width" > 0),
	CONSTRAINT "field_strip_test_number_of_plants_positive" CHECK ("field_strip_test"."number_of_plants" > 0),
	CONSTRAINT "field_strip_test_stems_per_plant_positive" CHECK ("field_strip_test"."stems_per_plant" IS NULL OR "field_strip_test"."stems_per_plant" > 0)
);
--> statement-breakpoint
ALTER TABLE "field_strip_test_group" ADD CONSTRAINT "field_strip_test_group_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_strip_test_group" ADD CONSTRAINT "field_strip_test_group_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_strip_test_tuber" ADD CONSTRAINT "field_strip_test_tuber_strip_test_id_field_strip_test_id_fk" FOREIGN KEY ("strip_test_id") REFERENCES "public"."field_strip_test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_strip_test_tuber" ADD CONSTRAINT "field_strip_test_tuber_tuber_size_id_tuber_size_id_fk" FOREIGN KEY ("tuber_size_id") REFERENCES "public"."tuber_size"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_strip_test" ADD CONSTRAINT "field_strip_test_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_strip_test" ADD CONSTRAINT "field_strip_test_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_strip_test" ADD CONSTRAINT "field_strip_test_group_field_fk" FOREIGN KEY ("group_id","field_id") REFERENCES "public"."field_strip_test_group"("id","field_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_strip_test_group_field_idx" ON "field_strip_test_group" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX "field_strip_test_field_start_idx" ON "field_strip_test" USING btree ("field_id","start_date");--> statement-breakpoint
CREATE INDEX "field_strip_test_group_idx" ON "field_strip_test" USING btree ("group_id");