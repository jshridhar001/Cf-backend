import { asc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { fieldIrrigations } from "@/db/schema/fields.js";
import type {
  CreateIrrigationBody,
  UpdateIrrigationBody,
} from "@/features/irrigation/irrigation.schema.js";

export async function createIrrigation(data: CreateIrrigationBody, createdById: string) {
  const [newIrrigation] = await db
    .insert(fieldIrrigations)
    .values({
      ...data,
      createdById,
    })
    .returning();
  return newIrrigation;
}

export async function getIrrigationsByFieldId(fieldId: string) {
  return db.query.fieldIrrigations.findMany({
    where: eq(fieldIrrigations.fieldId, fieldId),
    with: {
      createdBy: { columns: { id: true, name: true } },
    },
    orderBy: [asc(fieldIrrigations.cycleNumber)],
  });
}

export async function getIrrigationById(id: string) {
  return db.query.fieldIrrigations.findFirst({
    where: eq(fieldIrrigations.id, id),
    with: {
      createdBy: { columns: { id: true, name: true } },
    },
  });
}

export async function updateIrrigation(id: string, data: UpdateIrrigationBody) {
  const [updatedIrrigation] = await db
    .update(fieldIrrigations)
    .set(data)
    .where(eq(fieldIrrigations.id, id))
    .returning();
  return updatedIrrigation;
}

export async function deleteIrrigation(id: string) {
  const [deletedIrrigation] = await db
    .delete(fieldIrrigations)
    .where(eq(fieldIrrigations.id, id))
    .returning();
  return deletedIrrigation;
}

export async function deleteAllIrrigationsForField(fieldId: string) {
  return db
    .delete(fieldIrrigations)
    .where(eq(fieldIrrigations.fieldId, fieldId))
    .returning({ id: fieldIrrigations.id });
}
