CREATE TABLE "farmer_contract" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" uuid NOT NULL,
	"variety" text NOT NULL,
	"date" date NOT NULL,
	"acres" numeric(10, 2) NOT NULL,
	"contract_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "farmer_contract" ADD CONSTRAINT "farmer_contract_farmer_id_farmer_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "farmer_contract_farmer_id_idx" ON "farmer_contract" USING btree ("farmer_id");--> statement-breakpoint
ALTER TABLE "farmer" DROP COLUMN "contract_url";