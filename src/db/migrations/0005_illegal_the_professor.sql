ALTER TABLE "farmer_contract" ADD COLUMN "hindi_contract_url" text;--> statement-breakpoint
ALTER TABLE "farmer_contract" ADD COLUMN "is_notarized" boolean DEFAULT false NOT NULL;