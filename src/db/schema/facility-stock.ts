import { relations, sql } from "drizzle-orm";
import { check, integer, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { facilities, generations, seedSizes, varieties } from "@/db/schema/masters.js";

export const facilityStocks = pgTable(
  "facility_stock",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    facilityId: uuid("facility_id")
      .notNull()
      .references(() => facilities.id, { onDelete: "cascade" }),
    varietyId: uuid("variety_id")
      .notNull()
      .references(() => varieties.id),
    sizeId: uuid("size_id")
      .notNull()
      .references(() => seedSizes.id),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("facility_stock_key").on(t.facilityId, t.varietyId, t.sizeId, t.generationId),
    check("facility_stock_quantity_nonnegative", sql`${t.quantity} >= 0`),
  ],
);

export const facilityStocksRelations = relations(facilityStocks, ({ one }) => ({
  facility: one(facilities, {
    fields: [facilityStocks.facilityId],
    references: [facilities.id],
  }),
  variety: one(varieties, {
    fields: [facilityStocks.varietyId],
    references: [varieties.id],
  }),
  size: one(seedSizes, {
    fields: [facilityStocks.sizeId],
    references: [seedSizes.id],
  }),
  generation: one(generations, {
    fields: [facilityStocks.generationId],
    references: [generations.id],
  }),
}));
