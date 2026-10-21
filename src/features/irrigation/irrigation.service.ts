import { asc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmerFields } from "@/db/schema/fields.js";
import { fieldIrrigations } from "@/db/schema/irrigation.js";
import type {
  CreateIrrigationBody,
  UpdateIrrigationBody,
} from "@/features/irrigation/irrigation.schema.js";

const INVALID_FIELD = "Invalid field.";

export class IrrigationWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IrrigationWriteError";
  }
}

const irrigationWith = {
  field: {
    columns: {
      id: true,
      name: true,
      acres: true,
      farmerId: true,
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

async function findField(id: string) {
  const [row] = await db
    .select({ id: farmerFields.id })
    .from(farmerFields)
    .where(eq(farmerFields.id, id))
    .limit(1);
  return row;
}

async function assertIrrigationRules(input: {
  fieldId: string;
  startDate: string;
  endDate: string;
}) {
  if (input.endDate < input.startDate) {
    throw new IrrigationWriteError("End date cannot be before the start date.");
  }

  const field = await findField(input.fieldId);
  if (!field) {
    throw new IrrigationWriteError(INVALID_FIELD);
  }
}

export const irrigationsService = {
  async getAllIrrigations(fieldId?: string) {
    return await db.query.fieldIrrigations.findMany({
      where: fieldId ? eq(fieldIrrigations.fieldId, fieldId) : undefined,
      orderBy: [asc(fieldIrrigations.cycleNumber), asc(fieldIrrigations.createdAt)],
      with: irrigationWith,
    });
  },

  async getIrrigationById(id: string) {
    return await db.query.fieldIrrigations.findFirst({
      where: eq(fieldIrrigations.id, id),
      with: irrigationWith,
    });
  },

  async createIrrigation(data: CreateIrrigationBody, createdById: string) {
    await assertIrrigationRules({
      fieldId: data.fieldId,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    const [created] = await db
      .insert(fieldIrrigations)
      .values({
        fieldId: data.fieldId,
        cycleNumber: data.cycleNumber,
        startDate: data.startDate,
        endDate: data.endDate,
        mediaUrls: data.mediaUrls ?? null,
        remarks: data.remarks ?? null,
        createdById,
      })
      .returning({ id: fieldIrrigations.id });

    return await this.getIrrigationById(created.id);
  },

  async updateIrrigation(id: string, data: UpdateIrrigationBody) {
    const existing = await db.query.fieldIrrigations.findFirst({
      where: eq(fieldIrrigations.id, id),
    });

    if (!existing) {
      return undefined;
    }

    await assertIrrigationRules({
      fieldId: data.fieldId ?? existing.fieldId,
      startDate: data.startDate ?? existing.startDate,
      endDate: data.endDate ?? existing.endDate,
    });

    const [updated] = await db
      .update(fieldIrrigations)
      .set(data)
      .where(eq(fieldIrrigations.id, id))
      .returning({ id: fieldIrrigations.id });

    if (!updated) {
      return undefined;
    }

    return await this.getIrrigationById(updated.id);
  },

  async deleteIrrigation(id: string) {
    const [deleted] = await db
      .delete(fieldIrrigations)
      .where(eq(fieldIrrigations.id, id))
      .returning({ id: fieldIrrigations.id });
    return deleted;
  },
};
