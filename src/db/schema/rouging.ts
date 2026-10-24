import { relations, sql } from "drizzle-orm";
import { check, date, decimal, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmerFields } from "@/db/schema/fields.js";

export const fieldRougings = pgTable(
  "field_rouging",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "cascade" }),

    startDate: date("start_date", { mode: "string" }).notNull(),

    endDate: date("end_date", { mode: "string" }).notNull(),

    virusInfectedPlantsRemoved: decimal("virus_infected_plants_removed", {
      precision: 13,
      scale: 3,
    }),

    offVarietyTypeRemoval: decimal("off_variety_type_removal", {
      precision: 13,
      scale: 3,
    }),

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
    index("field_rouging_field_start_idx").on(t.fieldId, t.startDate),
    check(
      "field_rouging_virus_nonnegative",
      sql`${t.virusInfectedPlantsRemoved} IS NULL OR ${t.virusInfectedPlantsRemoved} >= 0`,
    ),
    check(
      "field_rouging_off_variety_nonnegative",
      sql`${t.offVarietyTypeRemoval} IS NULL OR ${t.offVarietyTypeRemoval} >= 0`,
    ),
    check("field_rouging_end_on_or_after_start", sql`${t.endDate} >= ${t.startDate}`),
  ],
);

export const fieldRougingsRelations = relations(fieldRougings, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldRougings.fieldId],
    references: [farmerFields.id],
  }),

  createdBy: one(user, {
    fields: [fieldRougings.createdById],
    references: [user.id],
  }),
}));
