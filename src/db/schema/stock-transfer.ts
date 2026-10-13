import { relations } from "drizzle-orm";
import {
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
import { farmers } from "@/db/schema/farmer.js";
import { generations, seedSizes, varieties } from "@/db/schema/masters.js";
import { stockTransferStatusEnum } from "@/db/schema/seed-dispatch.js";

export const stockTransfers = pgTable(
  "stock_transfer",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromFarmerId: uuid("from_farmer_id")
      .notNull()
      .references(() => farmers.id, { onDelete: "restrict" }),
    toFarmerId: uuid("to_farmer_id")
      .notNull()
      .references(() => farmers.id, { onDelete: "restrict" }),
    toLocation: text("to_location").notNull(),
    status: stockTransferStatusEnum("status").default("PENDING").notNull(),

    transferDate: timestamp("transfer_date"),
    truckNumber: text("truck_number").notNull(),
    driverMobile: text("driver_mobile"),
    manualGatePassNumber: text("manual_gate_pass_number"),
    weightSlipNumber: text("weight_slip_number"),

    grossWeight: decimal("gross_weight", { precision: 12, scale: 2 }),
    tareWeight: decimal("tare_weight", { precision: 12, scale: 2 }),
    netWeight: decimal("net_weight", { precision: 12, scale: 2 }),

    remarks: text("remarks"),
    createdById: text("created_by_id").references(() => user.id),
    receivedAt: timestamp("received_at"),
    receivedById: text("received_by_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("stock_transfer_status_date_idx").on(t.status, t.transferDate)],
);

export const stockTransferLines = pgTable(
  "stock_transfer_line",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stockTransferId: uuid("stock_transfer_id")
      .notNull()
      .references(() => stockTransfers.id, { onDelete: "cascade" }),
    varietyId: uuid("variety_id")
      .notNull()
      .references(() => varieties.id),
    sizeId: uuid("size_id")
      .notNull()
      .references(() => seedSizes.id),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id),
    bagQuantity: integer("bag_quantity").notNull(),
  },
  (t) => [
    unique("stock_transfer_line_key").on(t.stockTransferId, t.varietyId, t.sizeId, t.generationId),
  ],
);

export const stockTransfersRelations = relations(stockTransfers, ({ one, many }) => ({
  fromFarmer: one(farmers, {
    fields: [stockTransfers.fromFarmerId],
    references: [farmers.id],
    relationName: "stockTransferFromFarmer",
  }),
  toFarmer: one(farmers, {
    fields: [stockTransfers.toFarmerId],
    references: [farmers.id],
    relationName: "stockTransferToFarmer",
  }),
  lines: many(stockTransferLines),
}));

export const stockTransferLinesRelations = relations(stockTransferLines, ({ one }) => ({
  stockTransfer: one(stockTransfers, {
    fields: [stockTransferLines.stockTransferId],
    references: [stockTransfers.id],
  }),
  variety: one(varieties, {
    fields: [stockTransferLines.varietyId],
    references: [varieties.id],
  }),
  size: one(seedSizes, {
    fields: [stockTransferLines.sizeId],
    references: [seedSizes.id],
  }),
  generation: one(generations, {
    fields: [stockTransferLines.generationId],
    references: [generations.id],
  }),
}));
