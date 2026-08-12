import { relations } from "drizzle-orm";
import {
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
import {
  farmerFields,
  fieldDehaulmings,
  fieldPlantations,
  fieldRougings,
  fieldStripTests,
} from "@/db/schema/fields.js";

// --- 1. Enums ---

// Defines the strict types of automated tasks
export const taskActivityTypeEnum = pgEnum("task_activity_type", [
  "ROUGING",
  "STRIP_TEST_PRE_DEHAULMING",
  "DEHAULMING",
  "STRIP_TEST_POST_DEHAULMING",
]);

// Lifecycle statuses. OVERDUE = past dueDate and still unfinished (set by app when dueDate < today).
export const taskStatusEnum = pgEnum("task_status", ["PENDING", "OVERDUE", "DONE", "CANCELLED"]);

// gantt-task-react Task.type values
export const ganttTaskTypeEnum = pgEnum("gantt_task_type", ["task", "milestone", "project"]);

// --- 2. The Task Table ---

export const fieldTasks = pgTable(
  "field_task",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Core references
    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "cascade" }),
    plantationId: uuid("plantation_id")
      .notNull()
      .references(() => fieldPlantations.id, { onDelete: "cascade" }),
    assignedOfficerId: text("assigned_officer_id")
      .notNull()
      .references(() => user.id),

    // Task Definition
    activityType: taskActivityTypeEnum("activity_type").notNull(),
    status: taskStatusEnum("status").default("PENDING").notNull(),
    dueDate: date("due_date").notNull(),

    // Gantt domain fields (UI-only fields like styles stay on the frontend)
    name: text("name").notNull(),
    type: ganttTaskTypeEnum("type").default("task").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    progress: integer("progress").default(0).notNull(),
    dependencies: uuid("dependencies").array(),
    project: text("project"),

    // Strict, safe linkages to the actual completed records
    // Only ONE of these should be populated when status === 'DONE'
    completedRougingId: uuid("completed_rouging_id").references(() => fieldRougings.id, {
      onDelete: "set null",
    }),
    completedDehaulmingId: uuid("completed_dehaulming_id").references(() => fieldDehaulmings.id, {
      onDelete: "set null",
    }),
    completedStripTestId: uuid("completed_strip_test_id").references(() => fieldStripTests.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    // Officer dashboard: my tasks sorted by due date
    index("field_task_officer_due_date_idx").on(t.assignedOfficerId, t.status, t.dueDate),

    // Field / admin timeline: all tasks for a field
    index("field_task_field_status_idx").on(t.fieldId, t.status),

    // One task per essential step per plantation cycle
    unique("unique_task_per_plantation").on(t.plantationId, t.activityType),
  ],
);

// --- 3. Relations ---

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

  // Relations to the completed records
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
