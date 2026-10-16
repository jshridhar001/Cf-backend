CREATE TYPE "public"."gate_pass_status" AS ENUM('ACTIVE', 'NULL');--> statement-breakpoint
ALTER TABLE "cold_storage_gate_pass" ADD COLUMN "status" "gate_pass_status" DEFAULT 'ACTIVE' NOT NULL;