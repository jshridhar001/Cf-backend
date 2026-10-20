ALTER TABLE "field_plantation" ADD COLUMN "media_urls" text[];--> statement-breakpoint
ALTER TABLE "field_plantation" ADD COLUMN "remarks" text;--> statement-breakpoint
ALTER TABLE "field_plantation" DROP COLUMN "geo_location";