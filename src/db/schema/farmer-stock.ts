import { decimal, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { farmers } from "@/db/schema/farmer.js";
import { generations, seedSizes, varieties } from "@/db/schema/masters.js";

export const farmerStockBalances = pgTable(
  "farmer_stock_balance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmerId: uuid("farmer_id")
      .notNull()
      .references(() => farmers.id),
    varietyId: uuid("variety_id")
      .notNull()
      .references(() => varieties.id),
    sizeId: uuid("size_id")
      .notNull()
      .references(() => seedSizes.id),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id),
    balance: decimal("balance", { precision: 12, scale: 3 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique("farmer_stock_balance_key").on(t.farmerId, t.varietyId, t.sizeId, t.generationId)],
);
