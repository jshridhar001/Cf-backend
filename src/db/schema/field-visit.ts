import { relations, sql } from "drizzle-orm";
import { check, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmerFields } from "@/db/schema/fields.js";

export const fieldVisits = pgTable(
  "field_visit",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "cascade" }),

    startDate: date("start_date", { mode: "string" }).notNull(),

    endDate: date("end_date", { mode: "string" }).notNull(),

    observations: text("observations").notNull(),

    mediaUrls: text("media_urls").array(),

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
    index("field_visit_field_start_idx").on(t.fieldId, t.startDate),
    check("field_visit_end_on_or_after_start", sql`${t.endDate} >= ${t.startDate}`),
  ],
);

export const fieldVisitsRelations = relations(fieldVisits, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldVisits.fieldId],
    references: [farmerFields.id],
  }),

  createdBy: one(user, {
    fields: [fieldVisits.createdById],
    references: [user.id],
  }),
}));
