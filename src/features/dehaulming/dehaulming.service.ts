import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { fieldDehaulmings } from "@/db/schema/fields.js";
import type {
  CreateDehaulmingBody,
  UpdateDehaulmingBody,
} from "@/features/dehaulming/dehaulming.schema.js";
import { completeFieldTask } from "@/features/field-tasks/field-tasks.service.js";

export async function createDehaulming(data: CreateDehaulmingBody, createdById: string) {
  return db.transaction(async (tx) => {
    const [newDehaulming] = await tx
      .insert(fieldDehaulmings)
      .values({
        ...data,
        createdById,
      })
      .returning();

    await completeFieldTask(tx, {
      fieldId: data.fieldId,
      activityType: "DEHAULMING",
      completion: { completedDehaulmingId: newDehaulming.id },
    });

    return newDehaulming;
  });
}

export async function getDehaulmingsByFieldId(fieldId: string) {
  return db.query.fieldDehaulmings.findMany({
    where: eq(fieldDehaulmings.fieldId, fieldId),
    with: {
      createdBy: { columns: { id: true, name: true } },
    },
    orderBy: [desc(fieldDehaulmings.startDate)],
  });
}

export async function getDehaulmingById(id: string) {
  return db.query.fieldDehaulmings.findFirst({
    where: eq(fieldDehaulmings.id, id),
    with: {
      createdBy: { columns: { id: true, name: true } },
    },
  });
}

export async function updateDehaulming(id: string, data: UpdateDehaulmingBody) {
  const [updatedDehaulming] = await db
    .update(fieldDehaulmings)
    .set(data)
    .where(eq(fieldDehaulmings.id, id))
    .returning();
  return updatedDehaulming;
}

export async function deleteDehaulming(id: string) {
  const [deletedDehaulming] = await db
    .delete(fieldDehaulmings)
    .where(eq(fieldDehaulmings.id, id))
    .returning();
  return deletedDehaulming;
}

export async function deleteAllDehaulmingsForField(fieldId: string) {
  return db
    .delete(fieldDehaulmings)
    .where(eq(fieldDehaulmings.fieldId, fieldId))
    .returning({ id: fieldDehaulmings.id });
}
