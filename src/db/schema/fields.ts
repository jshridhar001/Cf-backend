import { relations } from "drizzle-orm";
import {
  date,
  decimal,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmers } from "@/db/schema/farmers.js";
import { fieldTasks } from "@/db/schema/field-tasks.js";
import { seedSizes, tuberSizes, varieties } from "@/db/schema/masters.js";

// --- Enums ---

export const fieldActivityRoundEnum = pgEnum("field_activity_round", [
  "PRE_DEHAULMING",
  "POST_DEHAULMING",
]);

export const activityGradeEnum = pgEnum("activity_grade", [
  "EXCELLENT",
  "SATISFACTORY",
  "NEEDS_ATTENTION",
  "POOR",
]);

// --- Core Field Table ---
export const farmerFields = pgTable(
  "farmer_field",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmerId: uuid("farmer_id")
      .notNull()
      .references(() => farmers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    geoLocation: text("geo_location"),
    acres: decimal("acres", { precision: 10, scale: 2 }).notNull(),
    assignedOfficerId: text("assigned_officer_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique("unique_field_name_per_farmer").on(t.farmerId, t.name)],
);

// --- Timeline A: Check-up Visits ---
export const fieldVisits = pgTable("field_visit", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => farmerFields.id, { onDelete: "cascade" }),

  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),

  geoLocation: text("geo_location"),

  observations: text("observations").notNull(),
  mediaUrls: text("media_urls").array(),

  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// --- Timeline B: Essential Steps ---

export const fieldPlantations = pgTable("field_plantation", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => farmerFields.id, { onDelete: "cascade" }),
  varietyId: uuid("variety_id")
    .notNull()
    .references(() => varieties.id, { onDelete: "restrict" }),
  sizeId: uuid("size_id")
    .notNull()
    .references(() => seedSizes.id, { onDelete: "restrict" }),

  bagCount: decimal("bag_count", { precision: 12, scale: 2 }).notNull(),
  acresPlanted: decimal("acres_planted", { precision: 10, scale: 2 }).notNull(),

  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),

  geoLocation: text("geo_location"),

  mediaUrls: text("media_urls").array(),
  remarks: text("remarks"),

  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const fieldIrrigations = pgTable(
  "field_irrigation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "cascade" }),
    cycleNumber: integer("cycle_number").notNull(),

    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),

    geoLocation: text("geo_location"),

    mediaUrls: text("media_urls").array(),
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
  (t) => [unique("unique_irrigation_cycle_per_field").on(t.fieldId, t.cycleNumber)],
);

export const fieldRougings = pgTable("field_rouging", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => farmerFields.id, { onDelete: "cascade" }),

  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),

  geoLocation: text("geo_location"),

  grade: activityGradeEnum("grade").notNull(),
  remarks: text("remarks"),
  mediaUrls: text("media_urls").array(),

  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const fieldDehaulmings = pgTable("field_dehaulming", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => farmerFields.id, { onDelete: "cascade" }),

  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),

  geoLocation: text("geo_location"),

  grade: activityGradeEnum("grade").notNull(),
  remarks: text("remarks"),
  mediaUrls: text("media_urls").array(),

  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const fieldStripTests = pgTable("field_strip_test", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => farmerFields.id, { onDelete: "cascade" }),

  round: fieldActivityRoundEnum("round").notNull(),

  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),

  geoLocation: text("geo_location"),

  stripLength: decimal("strip_length", { precision: 10, scale: 2 }).notNull(),
  stripWidth: decimal("strip_width", { precision: 10, scale: 2 }).notNull(),
  numberOfPlants: integer("number_of_plants").notNull(),
  stemsPerPlant: integer("stems_per_plant"),

  remarks: text("remarks"),
  mediaUrls: text("media_urls").array(),

  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const stripTestTuberRecords = pgTable(
  "strip_test_tuber_record",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stripTestId: uuid("strip_test_id")
      .notNull()
      .references(() => fieldStripTests.id, { onDelete: "cascade" }),
    tuberSizeId: uuid("tuber_size_id")
      .notNull()
      .references(() => tuberSizes.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    weightKg: decimal("weight_kg", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [unique("unique_tuber_size_per_strip_test").on(t.stripTestId, t.tuberSizeId)],
);

export const fieldHarvests = pgTable("field_harvest", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => farmerFields.id, { onDelete: "cascade" }),

  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),

  geoLocation: text("geo_location"),

  yieldEstimateKg: decimal("yield_estimate_kg", { precision: 12, scale: 2 }),
  remarks: text("remarks"),
  mediaUrls: text("media_urls").array(),

  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// --- Relations ---

export const farmerFieldsRelations = relations(farmerFields, ({ one, many }) => ({
  farmer: one(farmers, {
    fields: [farmerFields.farmerId],
    references: [farmers.id],
  }),
  assignedOfficer: one(user, {
    fields: [farmerFields.assignedOfficerId],
    references: [user.id],
  }),
  visits: many(fieldVisits),
  plantations: many(fieldPlantations),
  irrigations: many(fieldIrrigations),
  rougings: many(fieldRougings),
  dehaulmings: many(fieldDehaulmings),
  stripTests: many(fieldStripTests),
  harvests: many(fieldHarvests),
  tasks: many(fieldTasks),
}));

export const fieldVisitsRelations = relations(fieldVisits, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldVisits.fieldId],
    references: [farmerFields.id],
  }),
  createdBy: one(user, {
    fields: [fieldVisits.createdById],
    references: [user.id],
  }),
}));

export const fieldPlantationsRelations = relations(fieldPlantations, ({ one, many }) => ({
  field: one(farmerFields, {
    fields: [fieldPlantations.fieldId],
    references: [farmerFields.id],
  }),
  variety: one(varieties, {
    fields: [fieldPlantations.varietyId],
    references: [varieties.id],
  }),
  size: one(seedSizes, {
    fields: [fieldPlantations.sizeId],
    references: [seedSizes.id],
  }),
  createdBy: one(user, {
    fields: [fieldPlantations.createdById],
    references: [user.id],
  }),
  tasks: many(fieldTasks),
}));

export const fieldIrrigationsRelations = relations(fieldIrrigations, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldIrrigations.fieldId],
    references: [farmerFields.id],
  }),
  createdBy: one(user, {
    fields: [fieldIrrigations.createdById],
    references: [user.id],
  }),
}));

export const fieldRougingsRelations = relations(fieldRougings, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldRougings.fieldId],
    references: [farmerFields.id],
  }),
  createdBy: one(user, {
    fields: [fieldRougings.createdById],
    references: [user.id],
  }),
}));

export const fieldDehaulmingsRelations = relations(fieldDehaulmings, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldDehaulmings.fieldId],
    references: [farmerFields.id],
  }),
  createdBy: one(user, {
    fields: [fieldDehaulmings.createdById],
    references: [user.id],
  }),
}));

export const fieldStripTestsRelations = relations(fieldStripTests, ({ one, many }) => ({
  field: one(farmerFields, {
    fields: [fieldStripTests.fieldId],
    references: [farmerFields.id],
  }),
  createdBy: one(user, {
    fields: [fieldStripTests.createdById],
    references: [user.id],
  }),
  tuberRecords: many(stripTestTuberRecords),
}));

export const stripTestTuberRecordsRelations = relations(stripTestTuberRecords, ({ one }) => ({
  stripTest: one(fieldStripTests, {
    fields: [stripTestTuberRecords.stripTestId],
    references: [fieldStripTests.id],
  }),
  tuberSize: one(tuberSizes, {
    fields: [stripTestTuberRecords.tuberSizeId],
    references: [tuberSizes.id],
  }),
}));

export const fieldHarvestsRelations = relations(fieldHarvests, ({ one }) => ({
  field: one(farmerFields, {
    fields: [fieldHarvests.fieldId],
    references: [farmerFields.id],
  }),
  createdBy: one(user, {
    fields: [fieldHarvests.createdById],
    references: [user.id],
  }),
}));
