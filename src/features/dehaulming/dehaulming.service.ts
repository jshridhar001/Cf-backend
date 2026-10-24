import { asc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { fieldDehaulmings } from "@/db/schema/dehaulming.js";
import { farmerFields } from "@/db/schema/fields.js";
import type {
  CreateDehaulmingBody,
  UpdateDehaulmingBody,
} from "@/features/dehaulming/dehaulming.schema.js";

const INVALID_FIELD = "Invalid field.";

export class DehaulmingWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DehaulmingWriteError";
  }
}

const dehaulmingWith = {
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

async function assertDehaulmingRules(input: {
  fieldId: string;
  startDate: string;
  endDate: string;
}) {
  if (input.endDate < input.startDate) {
    throw new DehaulmingWriteError("End date cannot be before the start date.");
  }

  const field = await findField(input.fieldId);
  if (!field) {
    throw new DehaulmingWriteError(INVALID_FIELD);
  }
}

export const dehaulmingsService = {
  async getAllDehaulmings(fieldId?: string) {
    return await db.query.fieldDehaulmings.findMany({
      where: fieldId ? eq(fieldDehaulmings.fieldId, fieldId) : undefined,
      orderBy: [asc(fieldDehaulmings.startDate), asc(fieldDehaulmings.createdAt)],
      with: dehaulmingWith,
    });
  },

  async getDehaulmingById(id: string) {
    return await db.query.fieldDehaulmings.findFirst({
      where: eq(fieldDehaulmings.id, id),
      with: dehaulmingWith,
    });
  },

  async createDehaulming(data: CreateDehaulmingBody, createdById: string) {
    await assertDehaulmingRules({
      fieldId: data.fieldId,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    const [created] = await db
      .insert(fieldDehaulmings)
      .values({
        fieldId: data.fieldId,
        startDate: data.startDate,
        endDate: data.endDate,
        mediaUrls: data.mediaUrls ?? null,
        remarks: data.remarks ?? null,
        createdById,
      })
      .returning({ id: fieldDehaulmings.id });

    return await this.getDehaulmingById(created.id);
  },

  async updateDehaulming(id: string, data: UpdateDehaulmingBody) {
    const existing = await db.query.fieldDehaulmings.findFirst({
      where: eq(fieldDehaulmings.id, id),
    });

    if (!existing) {
      return undefined;
    }

    await assertDehaulmingRules({
      fieldId: data.fieldId ?? existing.fieldId,
      startDate: data.startDate ?? existing.startDate,
      endDate: data.endDate ?? existing.endDate,
    });

    const [updated] = await db
      .update(fieldDehaulmings)
      .set(data)
      .where(eq(fieldDehaulmings.id, id))
      .returning({ id: fieldDehaulmings.id });

    if (!updated) {
      return undefined;
    }

    return await this.getDehaulmingById(updated.id);
  },

  async deleteDehaulming(id: string) {
    const [deleted] = await db
      .delete(fieldDehaulmings)
      .where(eq(fieldDehaulmings.id, id))
      .returning({ id: fieldDehaulmings.id });
    return deleted;
  },
};
