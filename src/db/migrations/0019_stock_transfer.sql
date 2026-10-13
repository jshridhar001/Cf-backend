ALTER TYPE "public"."stock_transfer_status" ADD VALUE 'NULL';--> statement-breakpoint
CREATE TABLE "stock_transfer_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stock_transfer_id" uuid NOT NULL,
	"variety_id" uuid NOT NULL,
	"size_id" uuid NOT NULL,
	"generation_id" uuid NOT NULL,
	"bag_quantity" integer NOT NULL,
	CONSTRAINT "stock_transfer_line_key" UNIQUE("stock_transfer_id","variety_id","size_id","generation_id")
);
--> statement-breakpoint
CREATE TABLE "stock_transfer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_farmer_id" uuid NOT NULL,
	"to_farmer_id" uuid NOT NULL,
	"to_location" text NOT NULL,
	"status" "stock_transfer_status" DEFAULT 'PENDING' NOT NULL,
	"transfer_date" timestamp,
	"truck_number" text NOT NULL,
	"driver_mobile" text,
	"manual_gate_pass_number" text,
	"weight_slip_number" text,
	"gross_weight" numeric(12, 2),
	"tare_weight" numeric(12, 2),
	"net_weight" numeric(12, 2),
	"remarks" text,
	"created_by_id" text,
	"received_at" timestamp,
	"received_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_transfer_line" ADD CONSTRAINT "stock_transfer_line_stock_transfer_id_stock_transfer_id_fk" FOREIGN KEY ("stock_transfer_id") REFERENCES "public"."stock_transfer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_line" ADD CONSTRAINT "stock_transfer_line_variety_id_variety_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."variety"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_line" ADD CONSTRAINT "stock_transfer_line_size_id_seed_size_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."seed_size"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_line" ADD CONSTRAINT "stock_transfer_line_generation_id_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_from_farmer_id_farmer_id_fk" FOREIGN KEY ("from_farmer_id") REFERENCES "public"."farmer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_to_farmer_id_farmer_id_fk" FOREIGN KEY ("to_farmer_id") REFERENCES "public"."farmer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_received_by_id_user_id_fk" FOREIGN KEY ("received_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_transfer_status_date_idx" ON "stock_transfer" USING btree ("status","transfer_date");