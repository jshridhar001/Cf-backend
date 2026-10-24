import { asc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmerFields } from "@/db/schema/fields.js";
import { fieldRougings } from "@/db/schema/rouging.js";
import type { CreateRougingBody, UpdateRougingBody } from "@/features/rouging/rouging.schema.js";

const INVALID_FIELD = "Invalid field.";

export class RougingWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RougingWriteError";
  }
}

const rougingWith = {
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

async function assertRougingRules(input: { fieldId: string; startDate: string; endDate: string }) {
  if (input.endDate < input.startDate) {
    throw new RougingWriteError("End date cannot be before the start date.");
  }

  const field = await findField(input.fieldId);
  if (!field) {
    throw new RougingWriteError(INVALID_FIELD);
  }
}

export const rougingsService = {
  async getAllRougings(fieldId?: string) {
    return await db.query.fieldRougings.findMany({
      where: fieldId ? eq(fieldRougings.fieldId, fieldId) : undefined,
      orderBy: [asc(fieldRougings.startDate), asc(fieldRougings.createdAt)],
      with: rougingWith,
    });
  },

  async getRougingById(id: string) {
    return await db.query.fieldRougings.findFirst({
      where: eq(fieldRougings.id, id),
      with: rougingWith,
    });
  },

  async createRouging(data: CreateRougingBody, createdById: string) {
    await assertRougingRules({
      fieldId: data.fieldId,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    const [created] = await db
      .insert(fieldRougings)
      .values({
        fieldId: data.fieldId,
        startDate: data.startDate,
        endDate: data.endDate,
        virusInfectedPlantsRemoved: data.virusInfectedPlantsRemoved ?? null,
        offVarietyTypeRemoval: data.offVarietyTypeRemoval ?? null,
        mediaUrls: data.mediaUrls ?? null,
        remarks: data.remarks ?? null,
        createdById,
      })
      .returning({ id: fieldRougings.id });

    return await this.getRougingById(created.id);
  },

  async updateRouging(id: string, data: UpdateRougingBody) {
    const existing = await db.query.fieldRougings.findFirst({
      where: eq(fieldRougings.id, id),
    });

    if (!existing) {
      return undefined;
    }

    await assertRougingRules({
      fieldId: data.fieldId ?? existing.fieldId,
      startDate: data.startDate ?? existing.startDate,
      endDate: data.endDate ?? existing.endDate,
    });

    const [updated] = await db
      .update(fieldRougings)
      .set(data)
      .where(eq(fieldRougings.id, id))
      .returning({ id: fieldRougings.id });

    if (!updated) {
      return undefined;
    }

    return await this.getRougingById(updated.id);
  },

  async deleteRouging(id: string) {
    const [deleted] = await db
      .delete(fieldRougings)
      .where(eq(fieldRougings.id, id))
      .returning({ id: fieldRougings.id });
    return deleted;
  },
};
