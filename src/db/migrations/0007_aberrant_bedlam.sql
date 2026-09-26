CREATE TYPE "public"."farmer_account_type" AS ENUM('INDIVIDUAL', 'FAMILY_PRIMARY', 'FAMILY_MEMBER');--> statement-breakpoint
CREATE TYPE "public"."farmer_status" AS ENUM('ACTIVE', 'INACTIVE', 'BLACKLISTED');--> statement-breakpoint
CREATE TABLE "farmer_family" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"account_number" text NOT NULL,
	"station_id" uuid NOT NULL,
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
	"village_id" uuid,
	"post_office_id" uuid,
	"police_station_id" uuid,
	"district_id" uuid,
	"state_id" uuid,
	"pincode_id" uuid,
	"family_id" uuid,
	"contract_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "farmer_account_number_unique" UNIQUE("account_number"),
	CONSTRAINT "farmer_aadhar_number_unique" UNIQUE("aadhar_number"),
	CONSTRAINT "farmer_pan_number_unique" UNIQUE("pan_number")
);
--> statement-breakpoint
ALTER TABLE "farmer_family" ADD CONSTRAINT "farmer_family_station_id_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."station"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_station_id_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."station"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_village_id_village_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."village"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_post_office_id_post_office_id_fk" FOREIGN KEY ("post_office_id") REFERENCES "public"."post_office"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_police_station_id_police_station_id_fk" FOREIGN KEY ("police_station_id") REFERENCES "public"."police_station"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_district_id_district_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."district"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_state_id_state_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_pincode_id_pincode_id_fk" FOREIGN KEY ("pincode_id") REFERENCES "public"."pincode"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_family_id_farmer_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."farmer_family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_family_primary" ON "farmer" USING btree ("family_id") WHERE "farmer"."account_type" = 'FAMILY_PRIMARY';