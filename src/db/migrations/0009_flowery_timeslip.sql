CREATE TYPE "public"."req_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "seed_requisition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" uuid NOT NULL,
	"variety_id" uuid NOT NULL,
	"status" "req_status" DEFAULT 'PENDING' NOT NULL,
	"requested_bags" integer NOT NULL,
	"requested_acres" numeric(10, 2) NOT NULL,
	"fulfilled_bags" integer DEFAULT 0 NOT NULL,
	"fulfilled_acres" numeric(10, 2) DEFAULT '0' NOT NULL,
	"requisition_date" timestamp NOT NULL,
	"contract_date" timestamp NOT NULL,
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
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_farmer_id_farmer_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_variety_id_variety_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."variety"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition" ADD CONSTRAINT "seed_requisition_rejected_by_id_user_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seed_requisition_status_idx" ON "seed_requisition" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seed_requisition_farmer_id_idx" ON "seed_requisition" USING btree ("farmer_id");