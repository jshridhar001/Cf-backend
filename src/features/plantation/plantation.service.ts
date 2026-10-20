import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmerFields } from "@/db/schema/fields.js";
import { seedSizes, varieties } from "@/db/schema/masters.js";
import { fieldPlantations } from "@/db/schema/plantation.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";
import type {
  CreatePlantationBody,
  UpdatePlantationBody,
} from "@/features/plantation/plantation.schema.js";

const INVALID_REFERENCE = "Invalid field, variety, seed size, or requisition.";

export class PlantationWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlantationWriteError";
  }
}

const plantationWith = {
  field: {
    columns: {
      id: true,
      name: true,
      acres: true,
      farmerId: true,
    },
  },
  variety: {
    columns: {
      id: true,
      name: true,
    },
  },
  size: {
    columns: {
      id: true,
      name: true,
    },
  },
  requisition: {
    columns: {
      id: true,
      status: true,
    },
  },
  createdBy: {
    columns: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

type PlantationRulesInput = {
  fieldId: string;
  varietyId: string;
  sizeId: string;
  acresPlanted: string;
  startDate: string;
  endDate: string | null;
  requisitionId: string | null;
};

async function findField(id: string) {
  const [row] = await db
    .select({
      id: farmerFields.id,
      farmerId: farmerFields.farmerId,
      acres: farmerFields.acres,
    })
    .from(farmerFields)
    .where(eq(farmerFields.id, id))
    .limit(1);
  return row;
}

async function findVariety(id: string) {
  const [row] = await db
    .select({ id: varieties.id })
    .from(varieties)
    .where(eq(varieties.id, id))
    .limit(1);
  return row;
}

async function findSeedSize(id: string) {
  const [row] = await db
    .select({ id: seedSizes.id, varietyId: seedSizes.varietyId })
    .from(seedSizes)
    .where(eq(seedSizes.id, id))
    .limit(1);
  return row;
}

async function findRequisition(id: string) {
  const [row] = await db
    .select({
      id: seedRequisitions.id,
      farmerId: seedRequisitions.farmerId,
      varietyId: seedRequisitions.varietyId,
    })
    .from(seedRequisitions)
    .where(eq(seedRequisitions.id, id))
    .limit(1);
  return row;
}

async function assertPlantationRules(input: PlantationRulesInput) {
  if (input.endDate != null && input.endDate < input.startDate) {
    throw new PlantationWriteError("End date cannot be before the start date.");
  }

  const [field, variety, size, requisition] = await Promise.all([
    findField(input.fieldId),
    findVariety(input.varietyId),
    findSeedSize(input.sizeId),
    input.requisitionId ? findRequisition(input.requisitionId) : Promise.resolve(undefined),
  ]);

  if (!field || !variety || !size || (input.requisitionId && !requisition)) {
    throw new PlantationWriteError(INVALID_REFERENCE);
  }

  if (Number(input.acresPlanted) > Number(field.acres)) {
    throw new PlantationWriteError("Planted acres cannot exceed the field acres.");
  }

  if (size.varietyId && size.varietyId !== input.varietyId) {
    throw new PlantationWriteError("Seed size does not belong to this variety.");
  }

  if (requisition && requisition.farmerId !== field.farmerId) {
    throw new PlantationWriteError("Requisition does not belong to this field's farmer.");
  }

  if (requisition && requisition.varietyId !== input.varietyId) {
    throw new PlantationWriteError("Requisition variety does not match the plantation variety.");
  }
}

export const plantationsService = {
  async getAllPlantations(fieldId?: string) {
    return await db.query.fieldPlantations.findMany({
      where: fieldId ? eq(fieldPlantations.fieldId, fieldId) : undefined,
      orderBy: [desc(fieldPlantations.startDate), desc(fieldPlantations.createdAt)],
      with: plantationWith,
    });
  },

  async getPlantationById(id: string) {
    return await db.query.fieldPlantations.findFirst({
      where: eq(fieldPlantations.id, id),
      with: plantationWith,
    });
  },

  async createPlantation(data: CreatePlantationBody, createdById: string) {
    const endDate = data.endDate ?? null;
    const requisitionId = data.requisitionId ?? null;

    await assertPlantationRules({
      fieldId: data.fieldId,
      varietyId: data.varietyId,
      sizeId: data.sizeId,
      acresPlanted: data.acresPlanted,
      startDate: data.startDate,
      endDate,
      requisitionId,
    });

    const [created] = await db
      .insert(fieldPlantations)
      .values({
        fieldId: data.fieldId,
        varietyId: data.varietyId,
        sizeId: data.sizeId,
        bagCount: data.bagCount,
        acresPlanted: data.acresPlanted,
        startDate: data.startDate,
        endDate,
        requisitionId,
        mediaUrls: data.mediaUrls ?? null,
        remarks: data.remarks ?? null,
        createdById,
      })
      .returning({ id: fieldPlantations.id });

    return await this.getPlantationById(created.id);
  },

  async updatePlantation(id: string, data: UpdatePlantationBody) {
    const existing = await db.query.fieldPlantations.findFirst({
      where: eq(fieldPlantations.id, id),
    });

    if (!existing) {
      return undefined;
    }

    const endDate = data.endDate === undefined ? existing.endDate : data.endDate;
    const requisitionId =
      data.requisitionId === undefined ? existing.requisitionId : data.requisitionId;

    await assertPlantationRules({
      fieldId: data.fieldId ?? existing.fieldId,
      varietyId: data.varietyId ?? existing.varietyId,
      sizeId: data.sizeId ?? existing.sizeId,
      acresPlanted: data.acresPlanted ?? existing.acresPlanted,
      startDate: data.startDate ?? existing.startDate,
      endDate,
      requisitionId,
    });

    const [updated] = await db
      .update(fieldPlantations)
      .set(data)
      .where(eq(fieldPlantations.id, id))
      .returning({ id: fieldPlantations.id });

    if (!updated) {
      return undefined;
    }

    return await this.getPlantationById(updated.id);
  },

  async deletePlantation(id: string) {
    const [deleted] = await db
      .delete(fieldPlantations)
      .where(eq(fieldPlantations.id, id))
      .returning({ id: fieldPlantations.id });
    return deleted;
  },
};
