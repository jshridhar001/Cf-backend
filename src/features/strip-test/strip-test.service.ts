import { type asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmerFields } from "@/db/schema/fields.js";
import { tuberSizes } from "@/db/schema/masters.js";
import {
  fieldStripTestGroups,
  fieldStripTests,
  fieldStripTestTubers,
} from "@/db/schema/strip-test.js";
import type {
  CreateStripTestGroupBody,
  StripTest,
} from "@/features/strip-test/strip-test.schema.js";

const INVALID_FIELD = "Invalid field.";
const INVALID_TUBER_SIZE = "Invalid tuber size.";

export class StripTestWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripTestWriteError";
  }
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const stripTestGroupWith = {
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
  stripTests: {
    orderBy: (
      strips: {
        startDate: typeof fieldStripTests.startDate;
        createdAt: typeof fieldStripTests.createdAt;
      },
      operators: { asc: typeof asc },
    ) => [operators.asc(strips.startDate), operators.asc(strips.createdAt)],
    with: {
      tuberRecords: {
        with: {
          tuberSize: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
} as const;

function tuberSizeIds(stripTests: StripTest[]) {
  return [
    ...new Set(stripTests.flatMap((strip) => strip.tuberRecords.map((row) => row.tuberSizeId))),
  ];
}

async function assertReferences(tx: Transaction, fieldId: string, sizeIds: string[]) {
  const [field] = await tx
    .select({ id: farmerFields.id })
    .from(farmerFields)
    .where(eq(farmerFields.id, fieldId))
    .limit(1);

  if (!field) {
    throw new StripTestWriteError(INVALID_FIELD);
  }

  if (sizeIds.length === 0) {
    return;
  }

  const sizes = await tx
    .select({ id: tuberSizes.id })
    .from(tuberSizes)
    .where(inArray(tuberSizes.id, sizeIds));

  if (sizes.length !== sizeIds.length) {
    throw new StripTestWriteError(INVALID_TUBER_SIZE);
  }
}

async function insertStrips(
  tx: Transaction,
  groupId: string,
  fieldId: string,
  createdById: string,
  stripTests: StripTest[],
) {
  for (const strip of stripTests) {
    const [created] = await tx
      .insert(fieldStripTests)
      .values({
        groupId,
        fieldId,
        type: strip.type,
        startDate: strip.startDate,
        endDate: strip.endDate,
        stripLength: strip.stripLength,
        stripWidth: strip.stripWidth,
        numberOfPlants: strip.numberOfPlants,
        stemsPerPlant: strip.stemsPerPlant ?? null,
        mediaUrls: strip.mediaUrls ?? null,
        remarks: strip.remarks ?? null,
        createdById,
      })
      .returning({ id: fieldStripTests.id });

    await tx.insert(fieldStripTestTubers).values(
      strip.tuberRecords.map((record) => ({
        stripTestId: created.id,
        tuberSizeId: record.tuberSizeId,
        quantity: record.quantity,
        weightKg: record.weightKg,
      })),
    );
  }
}

export const stripTestGroupsService = {
  async getAllStripTestGroups(fieldId?: string) {
    return await db.query.fieldStripTestGroups.findMany({
      where: fieldId ? eq(fieldStripTestGroups.fieldId, fieldId) : undefined,
      orderBy: [desc(fieldStripTestGroups.createdAt)],
      with: stripTestGroupWith,
    });
  },

  async getStripTestGroupById(id: string) {
    return await db.query.fieldStripTestGroups.findFirst({
      where: eq(fieldStripTestGroups.id, id),
      with: stripTestGroupWith,
    });
  },

  async createStripTestGroup(data: CreateStripTestGroupBody, createdById: string) {
    const groupId = await db.transaction(async (tx) => {
      await assertReferences(tx, data.fieldId, tuberSizeIds(data.stripTests));

      const [created] = await tx
        .insert(fieldStripTestGroups)
        .values({
          fieldId: data.fieldId,
          name: data.name,
          createdById,
        })
        .returning({ id: fieldStripTestGroups.id });

      await insertStrips(tx, created.id, data.fieldId, createdById, data.stripTests);
      return created.id;
    });

    return await this.getStripTestGroupById(groupId);
  },

  async updateStripTestGroup(id: string, data: CreateStripTestGroupBody, createdById: string) {
    const updatedId = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: fieldStripTestGroups.id })
        .from(fieldStripTestGroups)
        .where(eq(fieldStripTestGroups.id, id))
        .limit(1);

      if (!existing) {
        return undefined;
      }

      await assertReferences(tx, data.fieldId, tuberSizeIds(data.stripTests));

      await tx.delete(fieldStripTests).where(eq(fieldStripTests.groupId, id));

      await tx
        .update(fieldStripTestGroups)
        .set({
          fieldId: data.fieldId,
          name: data.name,
        })
        .where(eq(fieldStripTestGroups.id, id));

      await insertStrips(tx, id, data.fieldId, createdById, data.stripTests);
      return id;
    });

    if (!updatedId) {
      return undefined;
    }

    return await this.getStripTestGroupById(updatedId);
  },

  async deleteStripTestGroup(id: string) {
    const [deleted] = await db
      .delete(fieldStripTestGroups)
      .where(eq(fieldStripTestGroups.id, id))
      .returning({ id: fieldStripTestGroups.id });
    return deleted;
  },
};
