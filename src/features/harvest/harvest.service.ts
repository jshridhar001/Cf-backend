import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { fieldHarvests } from "@/db/schema/fields.js";
import type { CreateHarvestBody, UpdateHarvestBody } from "@/features/harvest/harvest.schema.js";

export async function createHarvest(data: CreateHarvestBody, createdById: string) {
  const [newHarvest] = await db
    .insert(fieldHarvests)
    .values({
      ...data,
      createdById,
    })
    .returning();
  return newHarvest;
}

export async function getHarvestsByFieldId(fieldId: string) {
  return db.query.fieldHarvests.findMany({
    where: eq(fieldHarvests.fieldId, fieldId),
    with: {
      createdBy: { columns: { id: true, name: true } },
    },
    orderBy: [desc(fieldHarvests.startDate)],
  });
}

export async function getHarvestById(id: string) {
  return db.query.fieldHarvests.findFirst({
    where: eq(fieldHarvests.id, id),
    with: {
      createdBy: { columns: { id: true, name: true } },
    },
  });
}

export async function updateHarvest(id: string, data: UpdateHarvestBody) {
  const [updatedHarvest] = await db
    .update(fieldHarvests)
    .set(data)
    .where(eq(fieldHarvests.id, id))
    .returning();
  return updatedHarvest;
}

export async function deleteHarvest(id: string) {
  const [deletedHarvest] = await db
    .delete(fieldHarvests)
    .where(eq(fieldHarvests.id, id))
    .returning();
  return deletedHarvest;
}

export async function deleteAllHarvestsForField(fieldId: string) {
  return db
    .delete(fieldHarvests)
    .where(eq(fieldHarvests.fieldId, fieldId))
    .returning({ id: fieldHarvests.id });
}
