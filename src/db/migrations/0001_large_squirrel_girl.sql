CREATE TYPE "public"."instruction_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."gantt_task_type" AS ENUM('task', 'milestone', 'project');--> statement-breakpoint
CREATE TYPE "public"."task_activity_type" AS ENUM('ROUGING', 'STRIP_TEST_PRE_DEHAULMING', 'DEHAULMING', 'STRIP_TEST_POST_DEHAULMING');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('PENDING', 'OVERDUE', 'DONE', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "field_instruction_reply" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instruction_id" uuid NOT NULL,
	"created_by_id" text NOT NULL,
	"body" text NOT NULL,
	"media_urls" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_instruction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"assigned_officer_id" text NOT NULL,
	"created_by_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "instruction_status" DEFAULT 'PENDING' NOT NULL,
	"media_urls" text[],
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"plantation_id" uuid NOT NULL,
	"assigned_officer_id" text NOT NULL,
	"activity_type" "task_activity_type" NOT NULL,
	"status" "task_status" DEFAULT 'PENDING' NOT NULL,
	"due_date" date NOT NULL,
	"name" text NOT NULL,
	"type" "gantt_task_type" DEFAULT 'task' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"dependencies" uuid[],
	"project" text,
	"completed_rouging_id" uuid,
	"completed_dehaulming_id" uuid,
	"completed_strip_test_id" uuid,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_task_per_plantation" UNIQUE("plantation_id","activity_type")
);
--> statement-breakpoint
ALTER TABLE "field_instruction_reply" ADD CONSTRAINT "field_instruction_reply_instruction_id_field_instruction_id_fk" FOREIGN KEY ("instruction_id") REFERENCES "public"."field_instruction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_instruction_reply" ADD CONSTRAINT "field_instruction_reply_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_instruction" ADD CONSTRAINT "field_instruction_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_instruction" ADD CONSTRAINT "field_instruction_assigned_officer_id_user_id_fk" FOREIGN KEY ("assigned_officer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_instruction" ADD CONSTRAINT "field_instruction_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_plantation_id_field_plantation_id_fk" FOREIGN KEY ("plantation_id") REFERENCES "public"."field_plantation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_assigned_officer_id_user_id_fk" FOREIGN KEY ("assigned_officer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_completed_rouging_id_field_rouging_id_fk" FOREIGN KEY ("completed_rouging_id") REFERENCES "public"."field_rouging"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_completed_dehaulming_id_field_dehaulming_id_fk" FOREIGN KEY ("completed_dehaulming_id") REFERENCES "public"."field_dehaulming"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_completed_strip_test_id_field_strip_test_id_fk" FOREIGN KEY ("completed_strip_test_id") REFERENCES "public"."field_strip_test"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_instruction_reply_instruction_id_idx" ON "field_instruction_reply" USING btree ("instruction_id");--> statement-breakpoint
CREATE INDEX "field_instruction_officer_status_idx" ON "field_instruction" USING btree ("assigned_officer_id","status","due_date");--> statement-breakpoint
CREATE INDEX "field_instruction_field_status_idx" ON "field_instruction" USING btree ("field_id","status");--> statement-breakpoint
CREATE INDEX "field_task_officer_due_date_idx" ON "field_task" USING btree ("assigned_officer_id","status","due_date");--> statement-breakpoint
CREATE INDEX "field_task_field_status_idx" ON "field_task" USING btree ("field_id","status");