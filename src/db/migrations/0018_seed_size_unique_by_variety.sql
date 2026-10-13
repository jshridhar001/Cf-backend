ALTER TABLE "seed_size" DROP CONSTRAINT "seed_size_name_unique";--> statement-breakpoint
ALTER TABLE "seed_size" ADD CONSTRAINT "seed_size_variety_name_key" UNIQUE("variety_id","name");