CREATE TABLE "seed_requisition_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requisition_id" uuid NOT NULL,
	"delivery_date" timestamp NOT NULL,
	"acres" numeric(10, 2),
	"bags" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seed_requisition_delivery_req_date" UNIQUE("requisition_id","delivery_date"),
	CONSTRAINT "seed_requisition_delivery_one_quantity" CHECK (("seed_requisition_delivery"."acres" IS NOT NULL AND "seed_requisition_delivery"."bags" IS NULL) OR ("seed_requisition_delivery"."acres" IS NULL AND "seed_requisition_delivery"."bags" IS NOT NULL)),
	CONSTRAINT "seed_requisition_delivery_acres_positive" CHECK ("seed_requisition_delivery"."acres" IS NULL OR "seed_requisition_delivery"."acres" > 0),
	CONSTRAINT "seed_requisition_delivery_bags_positive" CHECK ("seed_requisition_delivery"."bags" IS NULL OR "seed_requisition_delivery"."bags" > 0)
);
--> statement-breakpoint
ALTER TABLE "seed_requisition_delivery" ADD CONSTRAINT "seed_requisition_delivery_requisition_id_seed_requisition_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."seed_requisition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seed_requisition_delivery_date_idx" ON "seed_requisition_delivery" USING btree ("delivery_date");--> statement-breakpoint
INSERT INTO "seed_requisition_delivery" ("requisition_id", "delivery_date", "acres", "bags")
SELECT
  "id",
  "requested_delivery_date",
  CASE
    WHEN "requested_acres" IS NOT NULL AND "requested_bags" IS NULL THEN "requested_acres"
    ELSE NULL
  END,
  CASE
    WHEN "requested_bags" IS NOT NULL AND "requested_acres" IS NULL THEN "requested_bags"
    ELSE NULL
  END
FROM "seed_requisition"
WHERE "requested_delivery_date" IS NOT NULL
  AND (
    ("requested_acres" IS NOT NULL AND "requested_bags" IS NULL AND "requested_acres" > 0)
    OR ("requested_bags" IS NOT NULL AND "requested_acres" IS NULL AND "requested_bags" > 0)
  );--> statement-breakpoint
ALTER TABLE "seed_requisition" DROP COLUMN "requested_delivery_date";