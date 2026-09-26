import { relations, sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
// Assuming all geographic master tables are exported from here
import {
  districts,
  pincodes,
  policeStations,
  postOffices,
  states,
  stations,
  villages,
} from "@/db/schema/masters.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";

// --- Enums ---
export const farmerAccountTypeEnum = pgEnum("farmer_account_type", [
  "INDIVIDUAL",
  "FAMILY_PRIMARY",
  "FAMILY_MEMBER",
]);

export const farmerStatusEnum = pgEnum("farmer_status", ["ACTIVE", "INACTIVE", "BLACKLISTED"]);

// --- Tables ---
export const farmerFamilies = pgTable("farmer_family", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  accountNumber: text("account_number").notNull().unique(),
  stationId: uuid("station_id")
    .notNull()
    .references(() => stations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const farmers = pgTable(
  "farmer",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    accountNumber: text("account_number").notNull().unique(),
    mobileNumber: text("mobile_number").notNull(),
    aadharNumber: text("aadhar_number").notNull().unique(),
    panNumber: text("pan_number").unique(),
    accountType: farmerAccountTypeEnum("account_type").notNull().default("INDIVIDUAL"),
    status: farmerStatusEnum("status").notNull().default("ACTIVE"),

    // --- Geographic & Administrative References ---
    stationId: uuid("station_id")
      .notNull()
      .references(() => stations.id, { onDelete: "restrict" }),
    villageId: uuid("village_id").references(() => villages.id, { onDelete: "restrict" }),
    postOfficeId: uuid("post_office_id").references(() => postOffices.id, { onDelete: "restrict" }),
    policeStationId: uuid("police_station_id").references(() => policeStations.id, {
      onDelete: "restrict",
    }),
    districtId: uuid("district_id").references(() => districts.id, { onDelete: "restrict" }),
    stateId: uuid("state_id").references(() => states.id, { onDelete: "restrict" }),
    pincodeId: uuid("pincode_id").references(() => pincodes.id, { onDelete: "restrict" }),

    familyId: uuid("family_id").references(() => farmerFamilies.id),
    contractUrl: text("contract_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    // Ensures a family can only have ONE Primary Account
    uniqueIndex("unique_family_primary")
      .on(t.familyId)
      .where(sql`${t.accountType} = 'FAMILY_PRIMARY'`),
  ],
);

// --- Relations ---
export const farmerFamiliesRelations = relations(farmerFamilies, ({ many }) => ({
  members: many(farmers),
}));

export const farmersRelations = relations(farmers, ({ one, many }) => ({
  seedRequisitions: many(seedRequisitions),
  family: one(farmerFamilies, {
    fields: [farmers.familyId],
    references: [farmerFamilies.id],
  }),
  station: one(stations, {
    fields: [farmers.stationId],
    references: [stations.id],
  }),
  village: one(villages, {
    fields: [farmers.villageId],
    references: [villages.id],
  }),
  postOffice: one(postOffices, {
    fields: [farmers.postOfficeId],
    references: [postOffices.id],
  }),
  policeStation: one(policeStations, {
    fields: [farmers.policeStationId],
    references: [policeStations.id],
  }),
  district: one(districts, {
    fields: [farmers.districtId],
    references: [districts.id],
  }),
  state: one(states, {
    fields: [farmers.stateId],
    references: [states.id],
  }),
  pincode: one(pincodes, {
    fields: [farmers.pincodeId],
    references: [pincodes.id],
  }),
}));
