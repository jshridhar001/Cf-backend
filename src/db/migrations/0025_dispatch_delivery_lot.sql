ALTER TABLE "dispatch_requisition" DROP CONSTRAINT "unique_dispatch_requisition";--> statement-breakpoint
ALTER TABLE "dispatch_requisition" ADD COLUMN "delivery_id" uuid;--> statement-breakpoint
ALTER TABLE "dispatch_requisition" ADD CONSTRAINT "dispatch_requisition_delivery_id_seed_requisition_delivery_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."seed_requisition_delivery"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dispatch_requisition_delivery_id_idx" ON "dispatch_requisition" USING btree ("delivery_id");--> statement-breakpoint
ALTER TABLE "dispatch_requisition" ADD CONSTRAINT "unique_dispatch_delivery" UNIQUE("dispatch_id","delivery_id");