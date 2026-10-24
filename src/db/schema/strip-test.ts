import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  decimal,
  foreignKey,
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
import { farmerFields } from "@/db/schema/fields.js";
import { tuberSizes } from "@/db/schema/masters.js";

export const stripTestTypeEnum = pgEnum("strip_test_type", ["PRE_DEHAULMING", "POST_DEHAULMING"]);

export const fieldStripTestGroups = pgTable(
  "field_strip_test_group",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

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
    unique("field_strip_test_group_id_field").on(t.id, t.fieldId),
    unique("unique_strip_test_group_name_per_field").on(t.fieldId, t.name),
    index("field_strip_test_group_field_idx").on(t.fieldId),
  ],
);

export const fieldStripTests = pgTable(
  "field_strip_test",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    groupId: uuid("group_id").notNull(),

    fieldId: uuid("field_id")
      .notNull()
      .references(() => farmerFields.id, { onDelete: "cascade" }),

    type: stripTestTypeEnum("type").notNull(),

    startDate: date("start_date", { mode: "string" }).notNull(),

    endDate: date("end_date", { mode: "string" }).notNull(),

    stripLength: decimal("strip_length", { precision: 13, scale: 3 }).notNull(),

    stripWidth: decimal("strip_width", { precision: 13, scale: 3 }).notNull(),

    numberOfPlants: integer("number_of_plants").notNull(),

    stemsPerPlant: integer("stems_per_plant"),

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
  (t) => [
    foreignKey({
      columns: [t.groupId, t.fieldId],
      foreignColumns: [fieldStripTestGroups.id, fieldStripTestGroups.fieldId],
      name: "field_strip_test_group_field_fk",
    }).onDelete("cascade"),
    index("field_strip_test_field_start_idx").on(t.fieldId, t.startDate),
    index("field_strip_test_group_idx").on(t.groupId),
    check("field_strip_test_end_on_or_after_start", sql`${t.endDate} >= ${t.startDate}`),
    check("field_strip_test_strip_length_positive", sql`${t.stripLength} > 0`),
    check("field_strip_test_strip_width_positive", sql`${t.stripWidth} > 0`),
    check("field_strip_test_number_of_plants_positive", sql`${t.numberOfPlants} > 0`),
    check(
      "field_strip_test_stems_per_plant_positive",
      sql`${t.stemsPerPlant} IS NULL OR ${t.stemsPerPlant} > 0`,
    ),
  ],
);

export const fieldStripTestTubers = pgTable(
  "field_strip_test_tuber",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    stripTestId: uuid("strip_test_id")
      .notNull()
      .references(() => fieldStripTests.id, { onDelete: "cascade" }),

    tuberSizeId: uuid("tuber_size_id")
      .notNull()
      .references(() => tuberSizes.id),

    quantity: integer("quantity").notNull(),

    weightKg: decimal("weight_kg", { precision: 13, scale: 3 }).notNull(),
  },
  (t) => [
    unique("field_strip_test_tuber_size_key").on(t.stripTestId, t.tuberSizeId),
    check("field_strip_test_tuber_quantity_nonnegative", sql`${t.quantity} >= 0`),
    check("field_strip_test_tuber_weight_nonnegative", sql`${t.weightKg} >= 0`),
  ],
);

export const fieldStripTestGroupsRelations = relations(fieldStripTestGroups, ({ one, many }) => ({
  field: one(farmerFields, {
    fields: [fieldStripTestGroups.fieldId],
    references: [farmerFields.id],
  }),
  createdBy: one(user, {
    fields: [fieldStripTestGroups.createdById],
    references: [user.id],
  }),
  stripTests: many(fieldStripTests),
}));

export const fieldStripTestsRelations = relations(fieldStripTests, ({ one, many }) => ({
  group: one(fieldStripTestGroups, {
    fields: [fieldStripTests.groupId],
    references: [fieldStripTestGroups.id],
  }),
  field: one(farmerFields, {
    fields: [fieldStripTests.fieldId],
    references: [farmerFields.id],
  }),
  createdBy: one(user, {
    fields: [fieldStripTests.createdById],
    references: [user.id],
  }),
  tuberRecords: many(fieldStripTestTubers),
}));

export const fieldStripTestTubersRelations = relations(fieldStripTestTubers, ({ one }) => ({
  stripTest: one(fieldStripTests, {
    fields: [fieldStripTestTubers.stripTestId],
    references: [fieldStripTests.id],
  }),
  tuberSize: one(tuberSizes, {
    fields: [fieldStripTestTubers.tuberSizeId],
    references: [tuberSizes.id],
  }),
}));
