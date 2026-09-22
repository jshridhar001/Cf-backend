import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// --- Enums ---
// Mirrors facilityUsageZodEnum (Zod is the source of truth)
export const facilityUsageEnum = pgEnum("facility_usage", [
  "SEED-REQUISITION",
  "SEED-DISPATCH",
  "FIELD-STEP",
]);

// --- Address hierarchy: State → District → PO → PS → Village → Area ---

export const states = pgTable("state", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const districts = pgTable(
  "district",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("district_state_name_unique").on(t.stateId, t.name),
    index("district_state_id_idx").on(t.stateId),
  ],
);

export const postOffices = pgTable(
  "post_office",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    pincode: text("pincode").notNull(),
    districtId: uuid("district_id")
      .notNull()
      .references(() => districts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("post_office_district_name_unique").on(t.districtId, t.name),
    index("post_office_district_id_idx").on(t.districtId),
    index("post_office_pincode_idx").on(t.pincode),
  ],
);

export const policeStations = pgTable(
  "police_station",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    postOfficeId: uuid("post_office_id")
      .notNull()
      .references(() => postOffices.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("police_station_post_office_name_unique").on(t.postOfficeId, t.name),
    index("police_station_post_office_id_idx").on(t.postOfficeId),
  ],
);

export const villages = pgTable(
  "village",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    policeStationId: uuid("police_station_id")
      .notNull()
      .references(() => policeStations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("village_police_station_name_unique").on(t.policeStationId, t.name),
    index("village_police_station_id_idx").on(t.policeStationId),
  ],
);

export const areas = pgTable(
  "area",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("area_village_name_unique").on(t.villageId, t.name),
    index("area_village_id_idx").on(t.villageId),
  ],
);

// --- Other masters ---

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

// --- Address relations ---

export const stateRelations = relations(states, ({ many }) => ({
  districts: many(districts),
}));

export const districtRelations = relations(districts, ({ one, many }) => ({
  state: one(states, {
    fields: [districts.stateId],
    references: [states.id],
  }),
  postOffices: many(postOffices),
}));

export const postOfficeRelations = relations(postOffices, ({ one, many }) => ({
  district: one(districts, {
    fields: [postOffices.districtId],
    references: [districts.id],
  }),
  policeStations: many(policeStations),
}));

export const policeStationRelations = relations(policeStations, ({ one, many }) => ({
  postOffice: one(postOffices, {
    fields: [policeStations.postOfficeId],
    references: [postOffices.id],
  }),
  villages: many(villages),
}));

export const villageRelations = relations(villages, ({ one, many }) => ({
  policeStation: one(policeStations, {
    fields: [villages.policeStationId],
    references: [policeStations.id],
  }),
  areas: many(areas),
}));

export const areaRelations = relations(areas, ({ one }) => ({
  village: one(villages, {
    fields: [areas.villageId],
    references: [villages.id],
  }),
}));
