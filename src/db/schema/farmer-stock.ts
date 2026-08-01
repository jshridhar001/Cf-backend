import { relations } from "drizzle-orm";
import { decimal, index, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { farmers } from "@/db/schema/farmers.js";
import { generations, seedSizes, varieties } from "@/db/schema/masters.js";

/**
 * Current farmer seed balances.
 * Credited on lot-receipt OTP confirm; debited on dispatch nullify (and later transfers).
 * Not updated when a dispatch is created.
 */
export const farmerStockBalances = pgTable(
  "farmer_stock_balance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmerId: uuid("farmer_id")
      .notNull()
      .references(() => farmers.id, { onDelete: "restrict" }),
    varietyId: uuid("variety_id")
      .notNull()
      .references(() => varieties.id, { onDelete: "restrict" }),
    sizeId: uuid("size_id")
      .notNull()
      .references(() => seedSizes.id, { onDelete: "restrict" }),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "restrict" }),

    balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("unique_farmer_stock_key").on(t.farmerId, t.varietyId, t.sizeId, t.generationId),
    index("farmer_stock_balance_farmer_id_idx").on(t.farmerId),
  ],
);

export const farmerStockBalancesRelations = relations(farmerStockBalances, ({ one }) => ({
  farmer: one(farmers, {
    fields: [farmerStockBalances.farmerId],
    references: [farmers.id],
  }),
  variety: one(varieties, {
    fields: [farmerStockBalances.varietyId],
    references: [varieties.id],
  }),
  size: one(seedSizes, {
    fields: [farmerStockBalances.sizeId],
    references: [seedSizes.id],
  }),
  generation: one(generations, {
    fields: [farmerStockBalances.generationId],
    references: [generations.id],
  }),
}));
