import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmerFields, fieldPlantations } from "@/db/schema/fields.js";
import { scheduleEssentialTasks } from "@/features/field-tasks/field-tasks.service.js";
import type {
  CreatePlantationBody,
  UpdatePlantationBody,
} from "@/features/plantation/plantation.schema.js";

export async function createPlantation(data: CreatePlantationBody, createdById: string) {
  return db.transaction(async (tx) => {
    const [newPlantation] = await tx
      .insert(fieldPlantations)
      .values({
        ...data,
        createdById,
      })
      .returning();

    const field = await tx.query.farmerFields.findFirst({
      where: eq(farmerFields.id, data.fieldId),
      columns: { assignedOfficerId: true },
    });

    if (!field) {
      throw new Error("Field not found for plantation.");
    }

    await scheduleEssentialTasks(tx, {
      fieldId: data.fieldId,
      plantationId: newPlantation.id,
      assignedOfficerId: field.assignedOfficerId,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    return newPlantation;
  });
}

export async function getPlantationsByFieldId(fieldId: string) {
  return db.query.fieldPlantations.findMany({
    where: eq(fieldPlantations.fieldId, fieldId),
    with: {
      variety: { columns: { id: true, name: true } },
      size: { columns: { id: true, name: true } },
      createdBy: { columns: { id: true, name: true } },
    },
    orderBy: [desc(fieldPlantations.startDate)],
  });
}

export async function getPlantationById(id: string) {
  return db.query.fieldPlantations.findFirst({
    where: eq(fieldPlantations.id, id),
    with: {
      variety: true,
      size: true,
      createdBy: { columns: { id: true, name: true } },
    },
  });
}

export async function updatePlantation(id: string, data: UpdatePlantationBody) {
  const [updatedPlantation] = await db
    .update(fieldPlantations)
    .set(data)
    .where(eq(fieldPlantations.id, id))
    .returning();
  return updatedPlantation;
}

export async function deletePlantation(id: string) {
  const [deletedPlantation] = await db
    .delete(fieldPlantations)
    .where(eq(fieldPlantations.id, id))
    .returning();
  return deletedPlantation;
}

export async function deleteAllPlantationsForField(fieldId: string) {
  return db
    .delete(fieldPlantations)
    .where(eq(fieldPlantations.fieldId, fieldId))
    .returning({ id: fieldPlantations.id });
}
