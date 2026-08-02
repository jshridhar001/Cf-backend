CREATE TYPE "public"."activity_grade" AS ENUM('EXCELLENT', 'SATISFACTORY', 'NEEDS_ATTENTION', 'POOR');--> statement-breakpoint
CREATE TYPE "public"."field_activity_round" AS ENUM('PRE_DEHAULMING', 'POST_DEHAULMING');--> statement-breakpoint
CREATE TABLE "farmer_field" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"geo_location" text,
	"acres" numeric(10, 2) NOT NULL,
	"assigned_officer_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_field_name_per_farmer" UNIQUE("farmer_id","name")
);
--> statement-breakpoint
CREATE TABLE "field_dehaulming" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"geo_location" text,
	"grade" "activity_grade" NOT NULL,
	"remarks" text,
	"media_urls" text[],
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_harvest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"geo_location" text,
	"yield_estimate_kg" numeric(12, 2),
	"remarks" text,
	"media_urls" text[],
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_irrigation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"cycle_number" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"geo_location" text,
	"media_urls" text[],
	"remarks" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_irrigation_cycle_per_field" UNIQUE("field_id","cycle_number")
);
--> statement-breakpoint
CREATE TABLE "field_plantation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"variety_id" uuid NOT NULL,
	"size_id" uuid NOT NULL,
	"bag_count" numeric(12, 2) NOT NULL,
	"acres_planted" numeric(10, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"geo_location" text,
	"media_urls" text[],
	"remarks" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_rouging" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"geo_location" text,
	"grade" "activity_grade" NOT NULL,
	"remarks" text,
	"media_urls" text[],
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_strip_test" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"round" "field_activity_round" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"geo_location" text,
	"strip_length" numeric(10, 2) NOT NULL,
	"strip_width" numeric(10, 2) NOT NULL,
	"number_of_plants" integer NOT NULL,
	"stems_per_plant" integer,
	"remarks" text,
	"media_urls" text[],
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_visit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"geo_location" text,
	"observations" text NOT NULL,
	"media_urls" text[],
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strip_test_tuber_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strip_test_id" uuid NOT NULL,
	"tuber_size_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"weight_kg" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_tuber_size_per_strip_test" UNIQUE("strip_test_id","tuber_size_id")
);
--> statement-breakpoint
ALTER TABLE "farmer_field" ADD CONSTRAINT "farmer_field_farmer_id_farmer_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_field" ADD CONSTRAINT "farmer_field_assigned_officer_id_user_id_fk" FOREIGN KEY ("assigned_officer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_dehaulming" ADD CONSTRAINT "field_dehaulming_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_dehaulming" ADD CONSTRAINT "field_dehaulming_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_harvest" ADD CONSTRAINT "field_harvest_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_harvest" ADD CONSTRAINT "field_harvest_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_irrigation" ADD CONSTRAINT "field_irrigation_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_irrigation" ADD CONSTRAINT "field_irrigation_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_plantation" ADD CONSTRAINT "field_plantation_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_plantation" ADD CONSTRAINT "field_plantation_variety_id_variety_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."variety"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_plantation" ADD CONSTRAINT "field_plantation_size_id_seed_size_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."seed_size"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_plantation" ADD CONSTRAINT "field_plantation_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_rouging" ADD CONSTRAINT "field_rouging_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_rouging" ADD CONSTRAINT "field_rouging_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_strip_test" ADD CONSTRAINT "field_strip_test_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_strip_test" ADD CONSTRAINT "field_strip_test_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_visit" ADD CONSTRAINT "field_visit_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_visit" ADD CONSTRAINT "field_visit_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strip_test_tuber_record" ADD CONSTRAINT "strip_test_tuber_record_strip_test_id_field_strip_test_id_fk" FOREIGN KEY ("strip_test_id") REFERENCES "public"."field_strip_test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strip_test_tuber_record" ADD CONSTRAINT "strip_test_tuber_record_tuber_size_id_tuber_size_id_fk" FOREIGN KEY ("tuber_size_id") REFERENCES "public"."tuber_size"("id") ON DELETE restrict ON UPDATE no action;