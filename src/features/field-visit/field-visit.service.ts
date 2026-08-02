import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { fieldVisits } from "@/db/schema/fields.js";
import type {
  CreateFieldVisitBody,
  UpdateFieldVisitBody,
} from "@/features/field-visit/field-visit.schema.js";

export async function createFieldVisit(data: CreateFieldVisitBody, createdById: string) {
  const [newVisit] = await db
    .insert(fieldVisits)
    .values({
      ...data,
      createdById,
    })
    .returning();
  return newVisit;
}

export async function getFieldVisitsByFieldId(fieldId: string) {
  return db.query.fieldVisits.findMany({
    where: eq(fieldVisits.fieldId, fieldId),
    with: {
      createdBy: { columns: { id: true, name: true } },
    },
    orderBy: [desc(fieldVisits.startDate)],
  });
}

export async function getFieldVisitById(id: string) {
  return db.query.fieldVisits.findFirst({
    where: eq(fieldVisits.id, id),
    with: {
      createdBy: { columns: { id: true, name: true } },
    },
  });
}

export async function updateFieldVisit(id: string, data: UpdateFieldVisitBody) {
  const [updatedVisit] = await db
    .update(fieldVisits)
    .set(data)
    .where(eq(fieldVisits.id, id))
    .returning();
  return updatedVisit;
}

export async function deleteFieldVisit(id: string) {
  const [deletedVisit] = await db.delete(fieldVisits).where(eq(fieldVisits.id, id)).returning();
  return deletedVisit;
}

export async function deleteAllFieldVisitsForField(fieldId: string) {
  return db
    .delete(fieldVisits)
    .where(eq(fieldVisits.fieldId, fieldId))
    .returning({ id: fieldVisits.id });
}
