CREATE TYPE "public"."req_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."dispatch_status" AS ENUM('LOADING', 'IN_TRANSIT', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."stop_status" AS ENUM('PENDING', 'RECEIVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "seed_requisition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" uuid NOT NULL,
	"variety_id" uuid NOT NULL,
	"status" "req_status" DEFAULT 'PENDING' NOT NULL,
	"requested_bags" integer,
	"requested_acres" numeric(11, 3),
	"fulfilled_bags" integer DEFAULT 0 NOT NULL,
	"fulfilled_acres" numeric(11, 3) DEFAULT '0' NOT NULL,
	"requisition_date" timestamp NOT NULL,
	"requested_delivery_date" timestamp NOT NULL,
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
	"status" "stop_status" DEFAULT 'PENDING' NOT NULL,
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
	"status" "dispatch_status" DEFAULT 'LOADING' NOT NULL,
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
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_farmer_id_farmer_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_variety_id_variety_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."variety"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_rejected_by_id_user_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition_size_line" ADD CONSTRAINT "dispatch_requisition_size_line_dispatch_requisition_id_dispatch_requisition_id_fk" FOREIGN KEY ("dispatch_requisition_id") REFERENCES "public"."dispatch_requisition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition_size_line" ADD CONSTRAINT "dispatch_requisition_size_line_facility_id_facility_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facility"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition_size_line" ADD CONSTRAINT "dispatch_requisition_size_line_size_id_seed_size_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."seed_size"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition_size_line" ADD CONSTRAINT "dispatch_requisition_size_line_generation_id_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition" ADD CONSTRAINT "dispatch_requisition_dispatch_id_dispatch_id_fk" FOREIGN KEY ("dispatch_id") REFERENCES "public"."dispatch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition" ADD CONSTRAINT "dispatch_requisition_requisition_id_seed_requisition_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."seed_requisition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_requisition" ADD CONSTRAINT "dispatch_requisition_received_by_id_user_id_fk" FOREIGN KEY ("received_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seed_requisition_status_created_at_idx" ON "seed_requisition" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "seed_requisition_created_at_idx" ON "seed_requisition" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "seed_requisition_farmer_id_idx" ON "seed_requisition" USING btree ("farmer_id");--> statement-breakpoint
CREATE INDEX "seed_requisition_variety_id_idx" ON "seed_requisition" USING btree ("variety_id");--> statement-breakpoint
CREATE INDEX "dispatch_requisition_req_id_idx" ON "dispatch_requisition" USING btree ("requisition_id");--> statement-breakpoint
CREATE INDEX "dispatch_status_date_idx" ON "dispatch" USING btree ("status","dispatch_date");