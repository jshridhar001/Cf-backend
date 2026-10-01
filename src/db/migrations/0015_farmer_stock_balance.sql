CREATE TABLE "farmer_stock_balance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" uuid NOT NULL,
	"variety_id" uuid NOT NULL,
	"size_id" uuid NOT NULL,
	"generation_id" uuid NOT NULL,
	"balance" numeric(12, 3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "farmer_stock_balance_key" UNIQUE("farmer_id","variety_id","size_id","generation_id")
);
--> statement-breakpoint
ALTER TABLE "farmer_stock_balance" ADD CONSTRAINT "farmer_stock_balance_farmer_id_farmer_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_stock_balance" ADD CONSTRAINT "farmer_stock_balance_variety_id_variety_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."variety"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_stock_balance" ADD CONSTRAINT "farmer_stock_balance_size_id_seed_size_id_fk" FOREIGN KEY ("size_id") REFERENCES "public"."seed_size"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_stock_balance" ADD CONSTRAINT "farmer_stock_balance_generation_id_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generation"("id") ON DELETE no action ON UPDATE no action;