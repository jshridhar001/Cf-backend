import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmerFields } from "@/db/schema/fields.js";
import { seedSizes, varieties } from "@/db/schema/masters.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";

export const fieldPlantations = pgTable(
  "field_plantation",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "restrict" }),

    varietyId: uuid("variety_id")
      .notNull()
      .references(() => varieties.id),

    sizeId: uuid("size_id")
      .notNull()
      .references(() => seedSizes.id),

    bagCount: integer("bag_count").notNull(),

    acresPlanted: decimal("acres_planted", { precision: 10, scale: 2 }).notNull(),

    startDate: date("start_date", { mode: "string" }).notNull(),

    endDate: date("end_date", { mode: "string" }),

    requisitionId: uuid("requisition_id").references(() => seedRequisitions.id, {
      onDelete: "restrict",
    }),

    mediaUrls: text("media_urls").array(),

    remarks: text("remarks"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("unique_plantation_id_field").on(t.id, t.fieldId),
    index("field_plantation_field_start_idx").on(t.fieldId, t.startDate),
    check("field_plantation_bag_count_positive", sql`${t.bagCount} > 0`),
    check("field_plantation_acres_planted_positive", sql`${t.acresPlanted} > 0`),
    check(
      "field_plantation_end_on_or_after_start",
      sql`${t.endDate} IS NULL OR ${t.endDate} >= ${t.startDate}`,
    ),
  ],
);

export const fieldPlantationsRelations = relations(fieldPlantations, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldPlantations.fieldId],
    references: [farmerFields.id],
  }),

  variety: one(varieties, {
    fields: [fieldPlantations.varietyId],
    references: [varieties.id],
  }),

  size: one(seedSizes, {
    fields: [fieldPlantations.sizeId],
    references: [seedSizes.id],
  }),

  requisition: one(seedRequisitions, {
    fields: [fieldPlantations.requisitionId],
    references: [seedRequisitions.id],
  }),

  createdBy: one(user, {
    fields: [fieldPlantations.createdById],
    references: [user.id],
  }),
}));
