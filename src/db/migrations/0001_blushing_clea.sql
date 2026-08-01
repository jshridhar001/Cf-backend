CREATE TYPE "public"."farmer_account_type" AS ENUM('INDIVIDUAL', 'FAMILY_PRIMARY', 'FAMILY_MEMBER');--> statement-breakpoint
CREATE TYPE "public"."farmer_status" AS ENUM('ACTIVE', 'INACTIVE', 'BLACKLISTED');--> statement-breakpoint
CREATE TYPE "public"."facility_usage" AS ENUM('SEED-REQUISITION', 'SEED-DISPATCH', 'FIELD-STEP');--> statement-breakpoint
CREATE TYPE "public"."dispatch_status" AS ENUM('IN_TRANSIT', 'DELIVERED', 'NULL');--> statement-breakpoint
CREATE TYPE "public"."lot_status" AS ENUM('PENDING', 'RECEIVED');--> statement-breakpoint
CREATE TYPE "public"."stock_transfer_status" AS ENUM('PENDING', 'RECEIVED');--> statement-breakpoint
CREATE TYPE "public"."req_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
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
CREATE TABLE "otp_challenge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purpose" text NOT NULL,
	"reference_id" text NOT NULL,
	"mobile_number" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_otp_purpose_reference" UNIQUE("purpose","reference_id")
);
--> statement-breakpoint
CREATE TABLE "dispatch_requisition_size_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispatch_requisition_id" uuid NOT NULL,
	"facility_id" uuid NOT NULL,
	"size_id" uuid NOT NULL,
	"generation_id" uuid NOT NULL,
	"bag_quantity" integer NOT NULL,
	CONSTRAINT "unique_size_gen_fac_per_req" UNIQUE("dispatch_requisition_id","facility_id","size_id","generation_id")
);
--> statement-breakpoint
CREATE TABLE "dispatch_requisition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispatch_id" uuid NOT NULL,
	"requisition_id" uuid NOT NULL,
	"status" "lot_status" DEFAULT 'PENDING' NOT NULL,
	"otp_sent_at" timestamp,
	"otp_verified_at" timestamp,
	"received_at" timestamp,
	"received_by_id" text,
	CONSTRAINT "unique_dispatch_requisition" UNIQUE("dispatch_id","requisition_id")
);
--> statement-breakpoint
CREATE TABLE "dispatch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_location" text NOT NULL,
	"status" "dispatch_status" DEFAULT 'NULL' NOT NULL,
	"dispatch_date" timestamp,
	"truck_number" text NOT NULL,
	"driver_mobile" text,
	"manual_gate_pass_number" text,
	"weight_slip_number" text,
	"gross_weight" numeric(12, 2),
	"tare_weight" numeric(12, 2),
	"net_weight" numeric(12, 2),
	"remarks" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seed_requisition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" uuid NOT NULL,
	"variety_id" uuid NOT NULL,
	"status" "req_status" DEFAULT 'PENDING' NOT NULL,
	"requested_bags" integer,
	"requested_acres" numeric(10, 2),
	"fulfilled_bags" integer DEFAULT 0 NOT NULL,
	"fulfilled_acres" numeric(10, 2) DEFAULT '0' NOT NULL,
	"requisition_date" timestamp NOT NULL,
	"requested_delivery_date" timestamp NOT NULL,
	"approved_delivery_date" timestamp,
	"remarks" text,
	"rejection_remarks" text,
	"created_by_id" text NOT NULL,
	"approved_by_id" text,
	"rejected_by_id" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "farmer_family" ADD CONSTRAINT "farmer_family_station_id_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."station"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_family" ADD CONSTRAINT "farmer_family_locality_id_locality_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."locality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_station_id_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."station"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_locality_id_locality_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."locality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_family_id_farmer_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."farmer_family"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locality" ADD CONSTRAINT "locality_station_id_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."station"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition_size_line" ADD CONSTRAINT "dispatch_requisition_size_line_dispatch_requisition_id_dispatch_requisition_id_fk" FOREIGN KEY ("dispatch_requisition_id") REFERENCES "public"."dispatch_requisition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition_size_line" ADD CONSTRAINT "dispatch_requisition_size_line_facility_id_facility_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facility"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition_size_line" ADD CONSTRAINT "dispatch_requisition_size_line_size_id_seed_size_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."seed_size"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition_size_line" ADD CONSTRAINT "dispatch_requisition_size_line_generation_id_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition" ADD CONSTRAINT "dispatch_requisition_dispatch_id_dispatch_id_fk" FOREIGN KEY ("dispatch_id") REFERENCES "public"."dispatch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition" ADD CONSTRAINT "dispatch_requisition_requisition_id_seed_requisition_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."seed_requisition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition" ADD CONSTRAINT "dispatch_requisition_received_by_id_user_id_fk" FOREIGN KEY ("received_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_farmer_id_farmer_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_variety_id_variety_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."variety"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_rejected_by_id_user_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_family_primary" ON "farmer" USING btree ("family_id") WHERE "farmer"."account_type" = 'FAMILY_PRIMARY';--> statement-breakpoint
CREATE INDEX "locality_station_id_idx" ON "locality" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "otp_challenge_expires_at_idx" ON "otp_challenge" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "dispatch_requisition_req_id_idx" ON "dispatch_requisition" USING btree ("requisition_id");--> statement-breakpoint
CREATE INDEX "dispatch_status_date_idx" ON "dispatch" USING btree ("status","dispatch_date");--> statement-breakpoint
CREATE INDEX "seed_requisition_status_idx" ON "seed_requisition" USING btree ("status");