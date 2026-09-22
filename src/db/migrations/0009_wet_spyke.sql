CREATE TABLE "state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "state_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "district" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"state_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "district_state_name_unique" UNIQUE("state_id","name")
);
--> statement-breakpoint
CREATE TABLE "post_office" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"pincode" text NOT NULL,
	"district_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_office_district_name_unique" UNIQUE("district_id","name")
);
--> statement-breakpoint
CREATE TABLE "police_station" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"post_office_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "police_station_post_office_name_unique" UNIQUE("post_office_id","name")
);
--> statement-breakpoint
CREATE TABLE "village" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"police_station_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "village_police_station_name_unique" UNIQUE("police_station_id","name")
);
--> statement-breakpoint
CREATE TABLE "area" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"village_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "area_village_name_unique" UNIQUE("village_id","name")
);
--> statement-breakpoint
ALTER TABLE "district" ADD CONSTRAINT "district_state_id_state_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_office" ADD CONSTRAINT "post_office_district_id_district_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."district"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "police_station" ADD CONSTRAINT "police_station_post_office_id_post_office_id_fk" FOREIGN KEY ("post_office_id") REFERENCES "public"."post_office"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "village" ADD CONSTRAINT "village_police_station_id_police_station_id_fk" FOREIGN KEY ("police_station_id") REFERENCES "public"."police_station"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area" ADD CONSTRAINT "area_village_id_village_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."village"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "district_state_id_idx" ON "district" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "post_office_district_id_idx" ON "post_office" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "post_office_pincode_idx" ON "post_office" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX "police_station_post_office_id_idx" ON "police_station" USING btree ("post_office_id");--> statement-breakpoint
CREATE INDEX "village_police_station_id_idx" ON "village" USING btree ("police_station_id");--> statement-breakpoint
CREATE INDEX "area_village_id_idx" ON "area" USING btree ("village_id");--> statement-breakpoint
ALTER TABLE "farmer_family" DROP CONSTRAINT IF EXISTS "farmer_family_station_id_station_id_fk";--> statement-breakpoint
ALTER TABLE "farmer_family" DROP CONSTRAINT IF EXISTS "farmer_family_locality_id_locality_id_fk";--> statement-breakpoint
ALTER TABLE "farmer" DROP CONSTRAINT IF EXISTS "farmer_station_id_station_id_fk";--> statement-breakpoint
ALTER TABLE "farmer" DROP CONSTRAINT IF EXISTS "farmer_locality_id_locality_id_fk";--> statement-breakpoint
ALTER TABLE "farmer_family" DROP COLUMN IF EXISTS "station_id";--> statement-breakpoint
ALTER TABLE "farmer_family" DROP COLUMN IF EXISTS "locality_id";--> statement-breakpoint
ALTER TABLE "farmer" DROP COLUMN IF EXISTS "station_id";--> statement-breakpoint
ALTER TABLE "farmer" DROP COLUMN IF EXISTS "locality_id";--> statement-breakpoint
DROP TABLE IF EXISTS "locality" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "station" CASCADE;--> statement-breakpoint
ALTER TABLE "farmer_family" ADD COLUMN "area_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "farmer" ADD COLUMN "area_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "farmer_family" ADD CONSTRAINT "farmer_family_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_area_id_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area"("id") ON DELETE no action ON UPDATE no action;
