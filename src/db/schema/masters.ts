import { relations } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// --- Enums ---
// Mirrors facilityUsageZodEnum (Zod is the source of truth)
export const facilityUsageEnum = pgEnum("facility_usage", [
  "SEED-REQUISITION",
  "SEED-DISPATCH",
  "FIELD-STEP",
]);

// --- Tables ---

export const stations = pgTable("station", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  state: text("state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const localities = pgTable(
  "locality",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    stationId: uuid("station_id")
      .notNull()
      .references(() => stations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => {
    // CRITICAL: Index the foreign key to prevent full table scans during joins
    return {
      stationIdIdx: index("locality_station_id_idx").on(table.stationId),
    };
  },
);

export const varieties = pgTable("variety", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const facilities = pgTable("facility", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  // Replaced generic text with a strict Postgres Enum
  usedIn: facilityUsageEnum("used_in").notNull(),

  // Track the total bags shipped from this facility during dispatch
  totalBagsDispatched: integer("total_bags_dispatched").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const seedSizes = pgTable("seed_size", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  seedBagsPerAcre: integer("seed_bags_per_acre"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const generations = pgTable("generation", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const tuberSizes = pgTable("tuber_size", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// --- Relations ---

export const stationRelations = relations(stations, ({ many }) => ({
  localities: many(localities),
}));

export const localityRelations = relations(localities, ({ one }) => ({
  station: one(stations, {
    fields: [localities.stationId],
    references: [stations.id],
  }),
}));

export const facilityRelations = relations(facilities, () => ({
  // dispatchesFrom: many(dispatches),
}));
