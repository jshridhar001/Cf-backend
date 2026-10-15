ALTER TABLE "seed_requisition" DROP CONSTRAINT "seed_requisition_approved_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "seed_requisition" DROP CONSTRAINT "seed_requisition_rejected_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "seed_requisition_delivery" ADD COLUMN "status" "req_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "seed_requisition_delivery" ADD COLUMN "approved_by_id" text;--> statement-breakpoint
ALTER TABLE "seed_requisition_delivery" ADD COLUMN "rejected_by_id" text;--> statement-breakpoint
ALTER TABLE "seed_requisition_delivery" ADD COLUMN "rejection_remarks" text;--> statement-breakpoint
ALTER TABLE "seed_requisition_delivery" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "seed_requisition_delivery" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "seed_requisition_delivery" ADD CONSTRAINT "seed_requisition_delivery_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_requisition_delivery" ADD CONSTRAINT "seed_requisition_delivery_rejected_by_id_user_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
UPDATE "seed_requisition_delivery" AS delivery
SET
  "status" = requisition."status",
  "approved_by_id" = requisition."approved_by_id",
  "approved_at" = requisition."approved_at",
  "rejected_by_id" = requisition."rejected_by_id",
  "rejected_at" = requisition."rejected_at",
  "rejection_remarks" = requisition."rejection_remarks"
FROM "seed_requisition" AS requisition
WHERE delivery."requisition_id" = requisition."id"
  AND requisition."status" <> 'PENDING';--> statement-breakpoint
UPDATE "seed_requisition" AS requisition
SET "status" = CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM "seed_requisition_delivery" AS delivery
    WHERE delivery."requisition_id" = requisition."id"
  ) THEN 'PENDING'::"req_status"
  WHEN NOT EXISTS (
    SELECT 1 FROM "seed_requisition_delivery" AS delivery
    WHERE delivery."requisition_id" = requisition."id" AND delivery."status" = 'PENDING'
  ) AND EXISTS (
    SELECT 1 FROM "seed_requisition_delivery" AS delivery
    WHERE delivery."requisition_id" = requisition."id" AND delivery."status" = 'APPROVED'
  ) THEN 'APPROVED'::"req_status"
  WHEN NOT EXISTS (
    SELECT 1 FROM "seed_requisition_delivery" AS delivery
    WHERE delivery."requisition_id" = requisition."id" AND delivery."status" <> 'REJECTED'
  ) THEN 'REJECTED'::"req_status"
  ELSE 'PENDING'::"req_status"
END;--> statement-breakpoint
ALTER TABLE "seed_requisition" DROP COLUMN "approved_delivery_date";--> statement-breakpoint
ALTER TABLE "seed_requisition" DROP COLUMN "rejection_remarks";--> statement-breakpoint
ALTER TABLE "seed_requisition" DROP COLUMN "approved_by_id";--> statement-breakpoint
ALTER TABLE "seed_requisition" DROP COLUMN "rejected_by_id";--> statement-breakpoint
ALTER TABLE "seed_requisition" DROP COLUMN "approved_at";--> statement-breakpoint
ALTER TABLE "seed_requisition" DROP COLUMN "rejected_at";