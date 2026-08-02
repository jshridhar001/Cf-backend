import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  farmerFields,
  fieldDehaulmings,
  fieldHarvests,
  fieldIrrigations,
  fieldPlantations,
  fieldRougings,
  fieldStripTests,
  fieldVisits,
} from "@/db/schema/fields.js";
import type {
  CreateFieldBody,
  GetFieldsQuery,
  UpdateFieldBody,
} from "@/features/fields/fields.schema.js";

export async function createField(data: CreateFieldBody) {
  const [newField] = await db.insert(farmerFields).values(data).returning();
  return newField;
}

export async function getFields(query: GetFieldsQuery) {
  const conditions = [];

  if (query.farmerId) conditions.push(eq(farmerFields.farmerId, query.farmerId));
  if (query.assignedOfficerId)
    conditions.push(eq(farmerFields.assignedOfficerId, query.assignedOfficerId));

  return db.query.farmerFields.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      farmer: {
        columns: { id: true, name: true },
      },
      assignedOfficer: {
        columns: { id: true, name: true },
      },
    },
    orderBy: [desc(farmerFields.createdAt)],
  });
}

export async function getFieldById(id: string) {
  return db.query.farmerFields.findFirst({
    where: eq(farmerFields.id, id),
    with: {
      farmer: true,
      assignedOfficer: {
        columns: { id: true, name: true, email: true },
      },
    },
  });
}

export async function getFieldActivitiesById(id: string) {
  return db.query.farmerFields.findFirst({
    where: eq(farmerFields.id, id),
    with: {
      farmer: true,
      assignedOfficer: {
        columns: { id: true, name: true, email: true },
      },
      visits: {
        with: { createdBy: { columns: { id: true, name: true } } },
        orderBy: [desc(fieldVisits.startDate)],
      },
      plantations: {
        with: {
          variety: { columns: { id: true, name: true } },
          size: { columns: { id: true, name: true } },
          createdBy: { columns: { id: true, name: true } },
        },
        orderBy: [desc(fieldPlantations.startDate)],
      },
      irrigations: {
        with: { createdBy: { columns: { id: true, name: true } } },
        orderBy: [desc(fieldIrrigations.startDate)],
      },
      rougings: {
        with: { createdBy: { columns: { id: true, name: true } } },
        orderBy: [desc(fieldRougings.startDate)],
      },
      dehaulmings: {
        with: { createdBy: { columns: { id: true, name: true } } },
        orderBy: [desc(fieldDehaulmings.startDate)],
      },
      stripTests: {
        with: {
          tuberRecords: {
            with: {
              tuberSize: { columns: { id: true, name: true } },
            },
          },
          createdBy: { columns: { id: true, name: true } },
        },
        orderBy: [desc(fieldStripTests.startDate)],
      },
      harvests: {
        with: { createdBy: { columns: { id: true, name: true } } },
        orderBy: [desc(fieldHarvests.startDate)],
      },
    },
  });
}

export async function updateField(id: string, data: UpdateFieldBody) {
  const [updatedField] = await db
    .update(farmerFields)
    .set(data)
    .where(eq(farmerFields.id, id))
    .returning();
  return updatedField;
}

export async function deleteField(id: string) {
  const [deletedField] = await db.delete(farmerFields).where(eq(farmerFields.id, id)).returning();
  return deletedField;
}
