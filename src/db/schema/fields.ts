import { relations } from "drizzle-orm";
import { decimal, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/access-control.js";
import { farmers } from "@/db/schema/farmer.js";

export const farmerFields = pgTable(
  "farmer_field",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    farmerId: uuid("farmer_id")
      .notNull()
      .references(() => farmers.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

    geoLocation: text("geo_location"),

    acres: decimal("acres", { precision: 11, scale: 3 }).notNull(),

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

export const farmerFieldsRelations = relations(farmerFields, ({ one }) => ({
  farmer: one(farmers, {
    fields: [farmerFields.farmerId],
    references: [farmers.id],
  }),

  assignedOfficer: one(user, {
    fields: [farmerFields.assignedOfficerId],
    references: [user.id],
  }),
}));
