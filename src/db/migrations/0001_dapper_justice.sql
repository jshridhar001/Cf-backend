CREATE TYPE "public"."farmer_account_type" AS ENUM('INDIVIDUAL', 'FAMILY_PRIMARY', 'FAMILY_MEMBER');--> statement-breakpoint
CREATE TYPE "public"."farmer_status" AS ENUM('ACTIVE', 'INACTIVE', 'BLACKLISTED');--> statement-breakpoint
CREATE TYPE "public"."facility_usage" AS ENUM('SEED-REQUISITION', 'SEED-DISPATCH', 'FIELD-STEP');--> statement-breakpoint
CREATE TABLE "farmer_family" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"account_number" text NOT NULL,
	"station_id" uuid NOT NULL,
	"locality_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "farmer_family_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "farmer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"account_number" text NOT NULL,
	"mobile_number" text NOT NULL,
	"aadhar_number" text NOT NULL,
	"pan_number" text,
	"account_type" "farmer_account_type" DEFAULT 'INDIVIDUAL' NOT NULL,
	"status" "farmer_status" DEFAULT 'ACTIVE' NOT NULL,
	"station_id" uuid NOT NULL,
	"locality_id" uuid NOT NULL,
	"family_id" uuid,
	"contract_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "farmer_account_number_unique" UNIQUE("account_number"),
	CONSTRAINT "farmer_aadhar_number_unique" UNIQUE("aadhar_number"),
	CONSTRAINT "farmer_pan_number_unique" UNIQUE("pan_number")
);
--> statement-breakpoint
CREATE TABLE "facility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"used_in" "facility_usage" NOT NULL,
	"total_bags_dispatched" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "facility_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "generation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "generation_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "locality" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"station_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seed_size" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"seed_bags_per_acre" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seed_size_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "station" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"state" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tuber_size" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tuber_size_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "variety" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "variety_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "farmer_family" ADD CONSTRAINT "farmer_family_station_id_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."station"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_family" ADD CONSTRAINT "farmer_family_locality_id_locality_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."locality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_station_id_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."station"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_locality_id_locality_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."locality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_family_id_farmer_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."farmer_family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locality" ADD CONSTRAINT "locality_station_id_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."station"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_family_primary" ON "farmer" USING btree ("family_id") WHERE "farmer"."account_type" = 'FAMILY_PRIMARY';--> statement-breakpoint
CREATE INDEX "locality_station_id_idx" ON "locality" USING btree ("station_id");