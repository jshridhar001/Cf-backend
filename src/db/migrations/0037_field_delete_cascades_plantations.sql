ALTER TABLE "field_plantation" DROP CONSTRAINT "field_plantation_field_id_farmer_field_id_fk";
--> statement-breakpoint
ALTER TABLE "field_plantation" ADD CONSTRAINT "field_plantation_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;