CREATE TYPE "public"."gantt_task_type" AS ENUM('TASK', 'MILESTONE', 'PROJECT');--> statement-breakpoint
CREATE TYPE "public"."task_activity_type" AS ENUM('ROUGING', 'STRIP_TEST_PRE_DEHAULMING', 'DEHAULMING', 'STRIP_TEST_POST_DEHAULMING');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "field_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"plantation_id" uuid NOT NULL,
	"assigned_officer_id" text NOT NULL,
	"activity_type" "task_activity_type" NOT NULL,
	"status" "task_status" DEFAULT 'PENDING' NOT NULL,
	"due_date" date NOT NULL,
	"name" text NOT NULL,
	"type" "gantt_task_type" DEFAULT 'TASK' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"dependencies" uuid[],
	"project" text,
	"completed_rouging_id" uuid,
	"completed_dehaulming_id" uuid,
	"completed_strip_test_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_task_per_plantation" UNIQUE("plantation_id","activity_type"),
	CONSTRAINT "mutually_exclusive_completion_fk" CHECK ((
        (CASE WHEN "field_task"."completed_rouging_id" IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN "field_task"."completed_dehaulming_id" IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN "field_task"."completed_strip_test_id" IS NOT NULL THEN 1 ELSE 0 END)
      ) <= 1),
	CONSTRAINT "valid_progress_range" CHECK ("field_task"."progress" >= 0 AND "field_task"."progress" <= 100)
);
--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_field_id_farmer_field_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."farmer_field"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_plantation_id_field_plantation_id_fk" FOREIGN KEY ("plantation_id") REFERENCES "public"."field_plantation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_assigned_officer_id_user_id_fk" FOREIGN KEY ("assigned_officer_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_completed_rouging_id_field_rouging_id_fk" FOREIGN KEY ("completed_rouging_id") REFERENCES "public"."field_rouging"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_completed_dehaulming_id_field_dehaulming_id_fk" FOREIGN KEY ("completed_dehaulming_id") REFERENCES "public"."field_dehaulming"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_task" ADD CONSTRAINT "field_task_completed_strip_test_id_field_strip_test_id_fk" FOREIGN KEY ("completed_strip_test_id") REFERENCES "public"."field_strip_test"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_task_officer_due_date_idx" ON "field_task" USING btree ("assigned_officer_id","status","due_date");--> statement-breakpoint
CREATE INDEX "field_task_field_status_idx" ON "field_task" USING btree ("field_id","status");--> statement-breakpoint
CREATE INDEX "field_task_plantation_idx" ON "field_task" USING btree ("plantation_id");--> statement-breakpoint
CREATE INDEX "field_task_completed_rouging_idx" ON "field_task" USING btree ("completed_rouging_id");--> statement-breakpoint
CREATE INDEX "field_task_completed_dehaulming_idx" ON "field_task" USING btree ("completed_dehaulming_id");--> statement-breakpoint
CREATE INDEX "field_task_completed_strip_test_idx" ON "field_task" USING btree ("completed_strip_test_id");