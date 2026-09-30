import { relations } from "drizzle-orm";
import {
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
import { facilities, generations, seedSizes } from "@/db/schema/masters.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";

export const dispatchStatusEnum = pgEnum("dispatch_status", ["IN_TRANSIT", "DELIVERED", "NULL"]);

export const lotStatusEnum = pgEnum("lot_status", ["PENDING", "RECEIVED"]);

export const stockTransferStatusEnum = pgEnum("stock_transfer_status", ["PENDING", "RECEIVED"]);

// --- 1. Dispatches (The Physical Truck) ---
export const dispatches = pgTable(
  "dispatch",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    toLocation: text("to_location").notNull(),
    status: dispatchStatusEnum("status").default("NULL").notNull(),

    dispatchDate: timestamp("dispatch_date"),
    truckNumber: text("truck_number").notNull(),
    driverMobile: text("driver_mobile"),
    manualGatePassNumber: text("manual_gate_pass_number"),
    weightSlipNumber: text("weight_slip_number"),

    grossWeight: decimal("gross_weight", { precision: 12, scale: 2 }),
    tareWeight: decimal("tare_weight", { precision: 12, scale: 2 }),
    netWeight: decimal("net_weight", { precision: 12, scale: 2 }),

    remarks: text("remarks"),
    createdById: text("created_by_id").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("dispatch_status_date_idx").on(t.status, t.dispatchDate)],
);

// --- 2. Dispatch Requisitions (The "Stops" + Merged Lot Details) ---
export const dispatchRequisitions = pgTable(
  "dispatch_requisition",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchId: uuid("dispatch_id")
      .notNull()
      .references(() => dispatches.id, { onDelete: "cascade" }),
    requisitionId: uuid("requisition_id")
      .notNull()
      .references(() => seedRequisitions.id, { onDelete: "restrict" }),

    status: lotStatusEnum("status").default("PENDING").notNull(),

    otpSentAt: timestamp("otp_sent_at"),
    otpVerifiedAt: timestamp("otp_verified_at"),
    receivedAt: timestamp("received_at"),
    receivedById: text("received_by_id").references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [
    unique("unique_dispatch_requisition").on(t.dispatchId, t.requisitionId),
    index("dispatch_requisition_req_id_idx").on(t.requisitionId),
  ],
);

// --- 3. Dispatch Size Lines (Graded Bags on the Truck for a Stop) ---
export const dispatchRequisitionSizeLines = pgTable(
  "dispatch_requisition_size_line",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dispatchRequisitionId: uuid("dispatch_requisition_id")
      .notNull()
      .references(() => dispatchRequisitions.id, { onDelete: "cascade" }),
    facilityId: uuid("facility_id")
      .notNull()
      .references(() => facilities.id),
    sizeId: uuid("size_id")
      .notNull()
      .references(() => seedSizes.id),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id),

    bagQuantity: integer("bag_quantity").notNull(),
  },
  (t) => [
    unique("unique_size_gen_fac_per_req").on(
      t.dispatchRequisitionId,
      t.facilityId,
      t.sizeId,
      t.generationId,
    ),
  ],
);

// --- Relations ---
export const dispatchesRelations = relations(dispatches, ({ many }) => ({
  dispatchRequisitions: many(dispatchRequisitions),
}));

export const dispatchRequisitionsRelations = relations(dispatchRequisitions, ({ one, many }) => ({
  dispatch: one(dispatches, {
    fields: [dispatchRequisitions.dispatchId],
    references: [dispatches.id],
  }),
  requisition: one(seedRequisitions, {
    fields: [dispatchRequisitions.requisitionId],
    references: [seedRequisitions.id],
  }),
  sizeLines: many(dispatchRequisitionSizeLines),
}));

export const dispatchRequisitionSizeLinesRelations = relations(
  dispatchRequisitionSizeLines,
  ({ one }) => ({
    dispatchRequisition: one(dispatchRequisitions, {
      fields: [dispatchRequisitionSizeLines.dispatchRequisitionId],
      references: [dispatchRequisitions.id],
    }),
    facility: one(facilities, {
      fields: [dispatchRequisitionSizeLines.facilityId],
      references: [facilities.id],
    }),
    size: one(seedSizes, {
      fields: [dispatchRequisitionSizeLines.sizeId],
      references: [seedSizes.id],
    }),
    generation: one(generations, {
      fields: [dispatchRequisitionSizeLines.generationId],
      references: [generations.id],
    }),
  }),
);
