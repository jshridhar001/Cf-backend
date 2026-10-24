import { asc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { fieldVisits } from "@/db/schema/field-visit.js";
import { farmerFields } from "@/db/schema/fields.js";
import type {
  CreateFieldVisitBody,
  UpdateFieldVisitBody,
} from "@/features/field-visit/field-visit.schema.js";

const INVALID_FIELD = "Invalid field.";

export class FieldVisitWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FieldVisitWriteError";
  }
}

const fieldVisitWith = {
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

async function assertFieldVisitRules(input: {
  fieldId: string;
  startDate: string;
  endDate: string;
}) {
  if (input.endDate < input.startDate) {
    throw new FieldVisitWriteError("End date cannot be before the start date.");
  }

  const field = await findField(input.fieldId);
  if (!field) {
    throw new FieldVisitWriteError(INVALID_FIELD);
  }
}

export const fieldVisitsService = {
  async getAllFieldVisits(fieldId?: string) {
    return await db.query.fieldVisits.findMany({
      where: fieldId ? eq(fieldVisits.fieldId, fieldId) : undefined,
      orderBy: [asc(fieldVisits.startDate), asc(fieldVisits.createdAt)],
      with: fieldVisitWith,
    });
  },

  async getFieldVisitById(id: string) {
    return await db.query.fieldVisits.findFirst({
      where: eq(fieldVisits.id, id),
      with: fieldVisitWith,
    });
  },

  async createFieldVisit(data: CreateFieldVisitBody, createdById: string) {
    await assertFieldVisitRules({
      fieldId: data.fieldId,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    const [created] = await db
      .insert(fieldVisits)
      .values({
        fieldId: data.fieldId,
        startDate: data.startDate,
        endDate: data.endDate,
        observations: data.observations,
        mediaUrls: data.mediaUrls ?? null,
        createdById,
      })
      .returning({ id: fieldVisits.id });

    return await this.getFieldVisitById(created.id);
  },

  async updateFieldVisit(id: string, data: UpdateFieldVisitBody) {
    const existing = await db.query.fieldVisits.findFirst({
      where: eq(fieldVisits.id, id),
    });

    if (!existing) {
      return undefined;
    }

    await assertFieldVisitRules({
      fieldId: data.fieldId ?? existing.fieldId,
      startDate: data.startDate ?? existing.startDate,
      endDate: data.endDate ?? existing.endDate,
    });

    const [updated] = await db
      .update(fieldVisits)
      .set(data)
      .where(eq(fieldVisits.id, id))
      .returning({ id: fieldVisits.id });

    if (!updated) {
      return undefined;
    }

    return await this.getFieldVisitById(updated.id);
  },

  async deleteFieldVisit(id: string) {
    const [deleted] = await db
      .delete(fieldVisits)
      .where(eq(fieldVisits.id, id))
      .returning({ id: fieldVisits.id });
    return deleted;
  },
};
