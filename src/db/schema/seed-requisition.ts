import { relations } from "drizzle-orm";
import {
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmers } from "@/db/schema/farmers.js";
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
      .references(() => farmers.id),
    varietyId: uuid("variety_id")
      .notNull()
      .references(() => varieties.id),

    status: reqStatusEnum("status").default("PENDING").notNull(),

    // Exactly one of bags or acres is set (enforced in Zod)
    requestedBags: integer("requested_bags"),
    requestedAcres: decimal("requested_acres", { precision: 11, scale: 3 }),

    // Track fulfillment progress
    fulfilledBags: integer("fulfilled_bags").default(0).notNull(),
    fulfilledAcres: decimal("fulfilled_acres", { precision: 11, scale: 3 }).default("0").notNull(),

    requisitionDate: timestamp("requisition_date").notNull(),
    requestedDeliveryDate: timestamp("requested_delivery_date").notNull(),
    remarks: text("remarks"),
    rejectionRemarks: text("rejection_remarks"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id),
    approvedById: text("approved_by_id").references(() => user.id),
    rejectedById: text("rejected_by_id").references(() => user.id),

    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("seed_requisition_status_created_at_idx").on(t.status, t.createdAt),
    index("seed_requisition_created_at_idx").on(t.createdAt),
    index("seed_requisition_farmer_id_idx").on(t.farmerId),
    index("seed_requisition_variety_id_idx").on(t.varietyId),
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
  dispatchStops: many(dispatchRequisitions), // Linked from the other file
}));
