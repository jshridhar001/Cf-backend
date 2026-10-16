import { relations, sql } from "drizzle-orm";
import { check, integer, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { facilities, generations, seedSizes, varieties } from "@/db/schema/masters.js";

export const gatePassStatusEnum = pgEnum("gate_pass_status", ["ACTIVE", "NULL"]);

export const coldStorageGatePasses = pgTable(
  "cold_storage_gate_pass",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    facilityId: uuid("facility_id")
      .notNull()
      .references(() => facilities.id),
    gatePassDate: timestamp("gate_pass_date").notNull(),
    varietyId: uuid("variety_id")
      .notNull()
      .references(() => varieties.id),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id),
    sizeId: uuid("size_id")
      .notNull()
      .references(() => seedSizes.id),
    quantity: integer("quantity").notNull(),
    status: gatePassStatusEnum("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [check("cold_storage_gate_pass_quantity_positive", sql`${t.quantity} > 0`)],
);

export const coldStorageGatePassesRelations = relations(coldStorageGatePasses, ({ one }) => ({
  facility: one(facilities, {
    fields: [coldStorageGatePasses.facilityId],
    references: [facilities.id],
  }),
  variety: one(varieties, {
    fields: [coldStorageGatePasses.varietyId],
    references: [varieties.id],
  }),
  generation: one(generations, {
    fields: [coldStorageGatePasses.generationId],
    references: [generations.id],
  }),
  size: one(seedSizes, {
    fields: [coldStorageGatePasses.sizeId],
    references: [seedSizes.id],
  }),
}));
