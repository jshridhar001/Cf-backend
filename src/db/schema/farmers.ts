import { relations, sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  date as pgDate,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { areas } from "@/db/schema/masters.js";

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
  areaId: uuid("area_id")
    .notNull()
    .references(() => areas.id),
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
    areaId: uuid("area_id")
      .notNull()
      .references(() => areas.id),
    familyId: uuid("family_id").references(() => farmerFamilies.id),
    bankName: text("bank_name"),
    ifscCode: text("ifsc_code"),
    bankAccountNumber: text("bank_account_number"),
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

export const farmerContracts = pgTable(
  "farmer_contract",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmerId: uuid("farmer_id")
      .notNull()
      .references(() => farmers.id, { onDelete: "cascade" }),
    variety: text("variety").notNull(),
    date: pgDate("date").notNull(),
    acres: decimal("acres", { precision: 10, scale: 3 }).notNull(),
    contractUrl: text("contract_url"),
    hindiContractUrl: text("hindi_contract_url"),
    isNotarized: boolean("is_notarized").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("farmer_contract_farmer_id_idx").on(t.farmerId)],
);

// --- Relations ---
export const farmerFamiliesRelations = relations(farmerFamilies, ({ many, one }) => ({
  members: many(farmers),
  area: one(areas, {
    fields: [farmerFamilies.areaId],
    references: [areas.id],
  }),
}));

export const farmersRelations = relations(farmers, ({ many, one }) => ({
  family: one(farmerFamilies, {
    fields: [farmers.familyId],
    references: [farmerFamilies.id],
  }),
  area: one(areas, {
    fields: [farmers.areaId],
    references: [areas.id],
  }),
  contracts: many(farmerContracts),
}));

export const farmerContractsRelations = relations(farmerContracts, ({ one }) => ({
  farmer: one(farmers, {
    fields: [farmerContracts.farmerId],
    references: [farmers.id],
  }),
}));
