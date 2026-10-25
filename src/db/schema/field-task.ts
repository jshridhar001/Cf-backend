import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { fieldDehaulmings } from "@/db/schema/dehaulming.js";
import { farmerFields } from "@/db/schema/fields.js";
import { fieldPlantations } from "@/db/schema/plantation.js";
import { fieldRougings } from "@/db/schema/rouging.js";
import { fieldStripTests } from "@/db/schema/strip-test.js";

// --- Enums ---

export const taskActivityTypeEnum = pgEnum("task_activity_type", [
  "ROUGING",
  "STRIP_TEST_PRE_DEHAULMING",
  "DEHAULMING",
  "STRIP_TEST_POST_DEHAULMING",
]);

// State-driven lifecycle statuses.
// Overdue evaluation is handled dynamically (dueDate < CURRENT_DATE and status = 'PENDING').
export const taskStatusEnum = pgEnum("task_status", [
  "PENDING",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
]);

// Standardized uppercase Gantt task types
export const ganttTaskTypeEnum = pgEnum("gantt_task_type", ["TASK", "MILESTONE", "PROJECT"]);

// --- Tables ---

export const fieldTasks = pgTable(
  "field_task",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "cascade" }),

    plantationId: uuid("plantation_id")
      .notNull()
      .references(() => fieldPlantations.id, { onDelete: "cascade" }),

    assignedOfficerId: text("assigned_officer_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    activityType: taskActivityTypeEnum("activity_type").notNull(),
    status: taskStatusEnum("status").default("PENDING").notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),

    // Gantt Domain Fields
    name: text("name").notNull(),
    type: ganttTaskTypeEnum("type").default("TASK").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    progress: integer("progress").default(0).notNull(),
    dependencies: uuid("dependencies").array(),
    project: text("project"),

    // Polymorphic Completion Tracking (Enforced mutually exclusive via CHECK constraint)
    completedRougingId: uuid("completed_rouging_id").references(() => fieldRougings.id, {
      onDelete: "set null",
    }),
    completedDehaulmingId: uuid("completed_dehaulming_id").references(() => fieldDehaulmings.id, {
      onDelete: "set null",
    }),
    completedStripTestId: uuid("completed_strip_test_id").references(() => fieldStripTests.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    // Unique task step per plantation lifecycle
    unique("unique_task_per_plantation").on(t.plantationId, t.activityType),

    // Essential Dashboard Query Indexes
    index("field_task_officer_due_date_idx").on(t.assignedOfficerId, t.status, t.dueDate),
    index("field_task_field_status_idx").on(t.fieldId, t.status),
    index("field_task_plantation_idx").on(t.plantationId),

    // Foreign Key Reference Indexes (Avoids sequential table scans during cascade deletes/joins)
    index("field_task_completed_rouging_idx").on(t.completedRougingId),
    index("field_task_completed_dehaulming_idx").on(t.completedDehaulmingId),
    index("field_task_completed_strip_test_idx").on(t.completedStripTestId),

    // Enforce that at most ONE completion FK is set
    check(
      "mutually_exclusive_completion_fk",
      sql`(
        (CASE WHEN ${t.completedRougingId} IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ${t.completedDehaulmingId} IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN ${t.completedStripTestId} IS NOT NULL THEN 1 ELSE 0 END)
      ) <= 1`,
    ),

    // Progress constraint (0% - 100%)
    check("valid_progress_range", sql`${t.progress} >= 0 AND ${t.progress} <= 100`),
  ],
);

// --- Relations ---

export const fieldTasksRelations = relations(fieldTasks, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldTasks.fieldId],
    references: [farmerFields.id],
  }),

  plantation: one(fieldPlantations, {
    fields: [fieldTasks.plantationId],
    references: [fieldPlantations.id],
  }),

  assignedOfficer: one(user, {
    fields: [fieldTasks.assignedOfficerId],
    references: [user.id],
  }),

  completedRouging: one(fieldRougings, {
    fields: [fieldTasks.completedRougingId],
    references: [fieldRougings.id],
  }),

  completedDehaulming: one(fieldDehaulmings, {
    fields: [fieldTasks.completedDehaulmingId],
    references: [fieldDehaulmings.id],
  }),

  completedStripTest: one(fieldStripTests, {
    fields: [fieldTasks.completedStripTestId],
    references: [fieldStripTests.id],
  }),
}));
