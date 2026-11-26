ALTER TABLE "farmer" ADD COLUMN "confirmation_otp_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "farmer" ADD COLUMN "confirmation_otp_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "farmer" ADD COLUMN "confirmation_otp_verified_by_id" text;--> statement-breakpoint
ALTER TABLE "farmer" ADD CONSTRAINT "farmer_confirmation_otp_verified_by_id_user_id_fk" FOREIGN KEY ("confirmation_otp_verified_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;