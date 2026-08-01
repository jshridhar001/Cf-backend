import { relations, sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { localities, stations } from "@/db/schema/masters.js";

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
  localityId: uuid("locality_id")
    .notNull()
    .references(() => localities.id),
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
    stationId: uuid("station_id")
      .notNull()
      .references(() => stations.id),
    localityId: uuid("locality_id")
      .notNull()
      .references(() => localities.id),
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

export const farmersRelations = relations(farmers, ({ one }) => ({
  family: one(farmerFamilies, {
    fields: [farmers.familyId],
    references: [farmerFamilies.id],
  }),
  station: one(stations, {
    fields: [farmers.stationId],
    references: [stations.id],
  }),
  locality: one(localities, {
    fields: [farmers.localityId],
    references: [localities.id],
  }),
}));
