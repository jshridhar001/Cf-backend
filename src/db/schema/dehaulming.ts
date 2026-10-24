import { relations, sql } from "drizzle-orm";
import { check, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmerFields } from "@/db/schema/fields.js";

export const fieldDehaulmings = pgTable(
  "field_dehaulming",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "cascade" }),

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
    index("field_dehaulming_field_start_idx").on(t.fieldId, t.startDate),
    check("field_dehaulming_end_on_or_after_start", sql`${t.endDate} >= ${t.startDate}`),
  ],
);

export const fieldDehaulmingsRelations = relations(fieldDehaulmings, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldDehaulmings.fieldId],
    references: [farmerFields.id],
  }),

  createdBy: one(user, {
    fields: [fieldDehaulmings.createdById],
    references: [user.id],
  }),
}));
