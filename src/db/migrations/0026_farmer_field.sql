CREATE TABLE "farmer_field" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"geo_location" text,
	"acres" numeric(11, 3) NOT NULL,
	"assigned_officer_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_field_name_per_farmer" UNIQUE("farmer_id","name")
);
--> statement-breakpoint
ALTER TABLE "farmer_field" ADD CONSTRAINT "farmer_field_farmer_id_farmer_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_field" ADD CONSTRAINT "farmer_field_assigned_officer_id_user_id_fk" FOREIGN KEY ("assigned_officer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;