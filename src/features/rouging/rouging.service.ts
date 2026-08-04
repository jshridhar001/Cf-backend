import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { fieldRougings } from "@/db/schema/fields.js";
import { completeFieldTask } from "@/features/field-tasks/field-tasks.service.js";
import type { CreateRougingBody, UpdateRougingBody } from "@/features/rouging/rouging.schema.js";

export async function createRouging(data: CreateRougingBody, createdById: string) {
  return db.transaction(async (tx) => {
    const [newRouging] = await tx
      .insert(fieldRougings)
      .values({
        ...data,
        createdById,
      })
      .returning();

    await completeFieldTask(tx, {
      fieldId: data.fieldId,
      activityType: "ROUGING",
      completion: { completedRougingId: newRouging.id },
    });

    return newRouging;
  });
}

export async function getRougingsByFieldId(fieldId: string) {
  return db.query.fieldRougings.findMany({
    where: eq(fieldRougings.fieldId, fieldId),
    with: {
      createdBy: { columns: { id: true, name: true } },
    },
    orderBy: [desc(fieldRougings.startDate)],
  });
}

export async function getRougingById(id: string) {
  return db.query.fieldRougings.findFirst({
    where: eq(fieldRougings.id, id),
    with: {
      createdBy: { columns: { id: true, name: true } },
    },
  });
}

export async function updateRouging(id: string, data: UpdateRougingBody) {
  const [updatedRouging] = await db
    .update(fieldRougings)
    .set(data)
    .where(eq(fieldRougings.id, id))
    .returning();
  return updatedRouging;
}

export async function deleteRouging(id: string) {
  const [deletedRouging] = await db
    .delete(fieldRougings)
    .where(eq(fieldRougings.id, id))
    .returning();
  return deletedRouging;
}

export async function deleteAllRougingsForField(fieldId: string) {
  return db
    .delete(fieldRougings)
    .where(eq(fieldRougings.fieldId, fieldId))
    .returning({ id: fieldRougings.id });
}
