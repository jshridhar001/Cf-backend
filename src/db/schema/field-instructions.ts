import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmerFields } from "@/db/schema/fields.js";

// --- Enums ---
export const instructionStatusEnum = pgEnum("instruction_status", [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// --- Core Instruction Table ---
export const fieldInstructions = pgTable(
  "field_instruction",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "cascade" }),

    // Copied from field at create time for efficient officer inbox queries
    assignedOfficerId: text("assigned_officer_id")
      .notNull()
      .references(() => user.id),

    // The Head Office user who issued the instruction
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id),

    title: text("title").notNull(),
    description: text("description").notNull(),

    // Enforces trackable states rather than just chat messages
    status: instructionStatusEnum("status").default("PENDING").notNull(),

    // Images attached by Head Office to illustrate the problem (Uploadthing URLs)
    mediaUrls: text("media_urls").array(),

    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    // Officer inbox: my instructions by status / due date
    index("field_instruction_officer_status_idx").on(t.assignedOfficerId, t.status, t.dueDate),

    // Field / admin timeline: all instructions for a field
    index("field_instruction_field_status_idx").on(t.fieldId, t.status),
  ],
);

// --- Replies / Proof of Work Table ---
export const fieldInstructionReplies = pgTable(
  "field_instruction_reply",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    instructionId: uuid("instruction_id")
      .notNull()
      .references(() => fieldInstructions.id, { onDelete: "cascade" }),

    // Can be the Field Officer replying, or Head Office clarifying
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id),

    body: text("body").notNull(),

    // Images attached by Field Officer as proof of completion (Uploadthing URLs)
    mediaUrls: text("media_urls").array(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("field_instruction_reply_instruction_id_idx").on(t.instructionId)],
);

// --- Relations ---
export const fieldInstructionsRelations = relations(fieldInstructions, ({ one, many }) => ({
  field: one(farmerFields, {
    fields: [fieldInstructions.fieldId],
    references: [farmerFields.id],
  }),
  assignedOfficer: one(user, {
    fields: [fieldInstructions.assignedOfficerId],
    references: [user.id],
    relationName: "fieldInstructionAssignedOfficer",
  }),
  createdBy: one(user, {
    fields: [fieldInstructions.createdById],
    references: [user.id],
    relationName: "fieldInstructionCreatedBy",
  }),
  replies: many(fieldInstructionReplies),
}));

export const fieldInstructionRepliesRelations = relations(fieldInstructionReplies, ({ one }) => ({
  instruction: one(fieldInstructions, {
    fields: [fieldInstructionReplies.instructionId],
    references: [fieldInstructions.id],
  }),
  createdBy: one(user, {
    fields: [fieldInstructionReplies.createdById],
    references: [user.id],
  }),
}));
