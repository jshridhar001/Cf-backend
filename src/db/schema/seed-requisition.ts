import { relations, sql } from "drizzle-orm";
import {
  check,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmers } from "@/db/schema/farmer.js";
import { varieties } from "@/db/schema/masters.js";
// Import dispatches to link the relations later
import { dispatchRequisitions } from "@/db/schema/seed-dispatch.js";

export const reqStatusEnum = pgEnum("req_status", ["PENDING", "APPROVED", "REJECTED"]);

export const seedRequisitions = pgTable(
  "seed_requisition",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmerId: uuid("farmer_id")
      .notNull()
      .references(() => farmers.id, { onDelete: "restrict" }),
    varietyId: uuid("variety_id")
      .notNull()
      .references(() => varieties.id),

    status: reqStatusEnum("status").default("PENDING").notNull(),

    // Exactly one of these is set. The other stays null.
    requestedBags: integer("requested_bags"),
    requestedAcres: decimal("requested_acres", { precision: 10, scale: 2 }),

    // Track fulfillment progress
    fulfilledBags: integer("fulfilled_bags").default(0).notNull(),
    fulfilledAcres: decimal("fulfilled_acres", { precision: 10, scale: 2 }).default("0").notNull(),

    requisitionDate: timestamp("requisition_date"),
    contractDate: timestamp("contract_date").notNull(),
    engContractUrl: text("eng_contract_url"),
    hindiContractUrl: text("hindi_contract_url"),
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
    index("seed_requisition_status_idx").on(t.status),
    index("seed_requisition_farmer_id_idx").on(t.farmerId),
  ],
);

export const seedRequisitionDeliveries = pgTable(
  "seed_requisition_delivery",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requisitionId: uuid("requisition_id")
      .notNull()
      .references(() => seedRequisitions.id, { onDelete: "cascade" }),
    deliveryDate: timestamp("delivery_date").notNull(),
    acres: decimal("acres", { precision: 10, scale: 2 }),
    bags: integer("bags"),
    status: reqStatusEnum("status").default("PENDING").notNull(),
    approvedById: text("approved_by_id").references(() => user.id),
    rejectedById: text("rejected_by_id").references(() => user.id),
    rejectionRemarks: text("rejection_remarks"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("seed_requisition_delivery_req_date").on(t.requisitionId, t.deliveryDate),
    index("seed_requisition_delivery_date_idx").on(t.deliveryDate),
    check(
      "seed_requisition_delivery_one_quantity",
      sql`(${t.acres} IS NOT NULL AND ${t.bags} IS NULL) OR (${t.acres} IS NULL AND ${t.bags} IS NOT NULL)`,
    ),
    check("seed_requisition_delivery_acres_positive", sql`${t.acres} IS NULL OR ${t.acres} > 0`),
    check("seed_requisition_delivery_bags_positive", sql`${t.bags} IS NULL OR ${t.bags} > 0`),
  ],
);

export const seedRequisitionRelations = relations(seedRequisitions, ({ one, many }) => ({
  farmer: one(farmers, {
    fields: [seedRequisitions.farmerId],
    references: [farmers.id],
  }),
  variety: one(varieties, {
    fields: [seedRequisitions.varietyId],
    references: [varieties.id],
  }),
  deliveries: many(seedRequisitionDeliveries),
  dispatchStops: many(dispatchRequisitions), // Linked from the other file
}));

export const seedRequisitionDeliveriesRelations = relations(
  seedRequisitionDeliveries,
  ({ one }) => ({
    requisition: one(seedRequisitions, {
      fields: [seedRequisitionDeliveries.requisitionId],
      references: [seedRequisitions.id],
    }),
  }),
);
