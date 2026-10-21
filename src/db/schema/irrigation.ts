import { relations, sql } from "drizzle-orm";
import { check, date, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmerFields } from "@/db/schema/fields.js";

export const fieldIrrigations = pgTable(
  "field_irrigation",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "cascade" }),

    cycleNumber: integer("cycle_number").notNull(),

    startDate: date("start_date", { mode: "string" }).notNull(),

    endDate: date("end_date", { mode: "string" }).notNull(),

    mediaUrls: text("media_urls").array(),

    remarks: text("remarks"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("unique_irrigation_cycle_per_field").on(t.fieldId, t.cycleNumber),
    check("field_irrigation_cycle_number_positive", sql`${t.cycleNumber} > 0`),
    check("field_irrigation_end_on_or_after_start", sql`${t.endDate} >= ${t.startDate}`),
  ],
);

export const fieldIrrigationsRelations = relations(fieldIrrigations, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldIrrigations.fieldId],
    references: [farmerFields.id],
  }),

  createdBy: one(user, {
    fields: [fieldIrrigations.createdById],
    references: [user.id],
  }),
}));
