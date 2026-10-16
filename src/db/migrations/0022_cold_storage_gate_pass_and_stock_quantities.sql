CREATE TABLE "cold_storage_gate_pass" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"gate_pass_date" timestamp NOT NULL,
	"variety_id" uuid NOT NULL,
	"size_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cold_storage_gate_pass_quantity_positive" CHECK ("cold_storage_gate_pass"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "facility_stock" ADD COLUMN "initial_quantity" integer;--> statement-breakpoint
ALTER TABLE "facility_stock" ADD COLUMN "current_quantity" integer;--> statement-breakpoint
UPDATE "facility_stock" SET "initial_quantity" = "quantity", "current_quantity" = "quantity";--> statement-breakpoint
ALTER TABLE "facility_stock" ALTER COLUMN "initial_quantity" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "facility_stock" ALTER COLUMN "current_quantity" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "facility_stock" DROP CONSTRAINT "facility_stock_quantity_nonnegative";--> statement-breakpoint
ALTER TABLE "cold_storage_gate_pass" ADD CONSTRAINT "cold_storage_gate_pass_facility_id_facility_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facility"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cold_storage_gate_pass" ADD CONSTRAINT "cold_storage_gate_pass_variety_id_variety_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."variety"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cold_storage_gate_pass" ADD CONSTRAINT "cold_storage_gate_pass_size_id_seed_size_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."seed_size"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_stock" DROP COLUMN "quantity";--> statement-breakpoint
ALTER TABLE "facility_stock" ADD CONSTRAINT "facility_stock_initial_quantity_nonnegative" CHECK ("facility_stock"."initial_quantity" >= 0);--> statement-breakpoint
ALTER TABLE "facility_stock" ADD CONSTRAINT "facility_stock_current_quantity_nonnegative" CHECK ("facility_stock"."current_quantity" >= 0);