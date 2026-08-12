import { relations } from "drizzle-orm";
import {
  date,
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmers } from "@/db/schema/farmers.js";
import { generations, seedSizes, varieties } from "@/db/schema/masters.js";

// Ensure this matches the enum you already defined
export const stockTransferStatusEnum = pgEnum("stock_transfer_status", ["PENDING", "RECEIVED"]);

// --- 1. Farmer Stock Balance ---
export const farmerStockBalances = pgTable(
  "farmer_stock_balance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmerId: uuid("farmer_id")
      .notNull()
      .references(() => farmers.id, { onDelete: "cascade" }),
    varietyId: uuid("variety_id")
      .notNull()
      .references(() => varieties.id, { onDelete: "restrict" }),
    sizeId: uuid("size_id")
      .notNull()
      .references(() => seedSizes.id, { onDelete: "restrict" }),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "restrict" }),

    balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),

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

// --- 2. Stock Transfers (Header) ---
export const stockTransfers = pgTable(
  "stock_transfer",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transferDate: date("transfer_date", { mode: "string" }).notNull(),
    fromFarmerId: uuid("from_farmer_id")
      .notNull()
      .references(() => farmers.id, { onDelete: "restrict" }),
    toFarmerId: uuid("to_farmer_id")
      .notNull()
      .references(() => farmers.id, { onDelete: "restrict" }),

    remarks: text("remarks"),
    status: stockTransferStatusEnum("status").default("PENDING").notNull(),

    otpSentAt: timestamp("otp_sent_at"),
    otpVerifiedAt: timestamp("otp_verified_at"),

    receivedAt: timestamp("received_at"),
    receivedById: text("received_by_id").references(() => user.id, { onDelete: "set null" }),

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
    index("stock_transfer_status_date_idx").on(t.status, t.transferDate),
    index("stock_transfer_from_farmer_idx").on(t.fromFarmerId),
    index("stock_transfer_to_farmer_idx").on(t.toFarmerId),
  ],
);

// --- 3. Stock Transfer Lines (Items) ---
export const stockTransferLines = pgTable(
  "stock_transfer_line",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transferId: uuid("transfer_id")
      .notNull()
      .references(() => stockTransfers.id, { onDelete: "cascade" }),

    varietyId: uuid("variety_id")
      .notNull()
      .references(() => varieties.id, { onDelete: "restrict" }),
    sizeId: uuid("size_id")
      .notNull()
      .references(() => seedSizes.id, { onDelete: "restrict" }),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "restrict" }),

    quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  },
  (t) => [
    unique("unique_stock_key_per_transfer").on(t.transferId, t.varietyId, t.sizeId, t.generationId),
  ],
);

// --- Relations ---

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

export const stockTransfersRelations = relations(stockTransfers, ({ one, many }) => ({
  fromFarmer: one(farmers, {
    fields: [stockTransfers.fromFarmerId],
    references: [farmers.id],
    relationName: "transfer_from_farmer",
  }),
  toFarmer: one(farmers, {
    fields: [stockTransfers.toFarmerId],
    references: [farmers.id],
    relationName: "transfer_to_farmer",
  }),
  createdBy: one(user, {
    fields: [stockTransfers.createdById],
    references: [user.id],
    relationName: "transfer_created_by",
  }),
  receivedBy: one(user, {
    fields: [stockTransfers.receivedById],
    references: [user.id],
    relationName: "transfer_received_by",
  }),
  lines: many(stockTransferLines),
}));

export const stockTransferLinesRelations = relations(stockTransferLines, ({ one }) => ({
  transfer: one(stockTransfers, {
    fields: [stockTransferLines.transferId],
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
