ALTER TABLE "farmer" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "farmer" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "farmer" ADD COLUMN "ifsc_code" text;--> statement-breakpoint
UPDATE "farmer" SET "bank_name" = 'State Bank of India', "bank_account_number" = '000000000000', "ifsc_code" = 'SBIN0000001' WHERE "bank_name" IS NULL;--> statement-breakpoint
ALTER TABLE "farmer" ALTER COLUMN "bank_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "farmer" ALTER COLUMN "bank_account_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "farmer" ALTER COLUMN "ifsc_code" SET NOT NULL;