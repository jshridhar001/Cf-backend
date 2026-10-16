import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { facilityStocks } from "@/db/schema/facility-stock.js";
import { facilities, generations, seedSizes, varieties } from "@/db/schema/masters.js";
import type {
  CreateFacilityStockBody,
  UpdateFacilityStockBody,
} from "@/features/master/facility-stock/facility-stock.schema.js";

export class FacilityStockCrudError extends Error {
  statusCode: 400 | 404;

  constructor(statusCode: 400 | 404, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function assertIdExists(
  id: string,
  find: (id: string) => Promise<{ id: string } | undefined>,
  statusCode: 400 | 404,
  message: string,
) {
  const row = await find(id);
  if (!row) {
    throw new FacilityStockCrudError(statusCode, message);
  }
}

async function findFacility(id: string) {
  const [row] = await db
    .select({ id: facilities.id })
    .from(facilities)
    .where(eq(facilities.id, id))
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
    .select({ id: seedSizes.id })
    .from(seedSizes)
    .where(eq(seedSizes.id, id))
    .limit(1);
  return row;
}

async function findGeneration(id: string) {
  const [row] = await db
    .select({ id: generations.id })
    .from(generations)
    .where(eq(generations.id, id))
    .limit(1);
  return row;
}

export const facilityStockService = {
  async getAllFacilityStocks(facilityId?: string) {
    return await db.query.facilityStocks.findMany({
      where: facilityId ? eq(facilityStocks.facilityId, facilityId) : undefined,
      orderBy: [desc(facilityStocks.createdAt)],
    });
  },

  async createFacilityStock(data: CreateFacilityStockBody) {
    await assertIdExists(data.facilityId, findFacility, 404, "Facility not found.");
    await assertIdExists(data.varietyId, findVariety, 400, "Variety not found.");
    await assertIdExists(data.sizeId, findSeedSize, 400, "Seed size not found.");
    await assertIdExists(data.generationId, findGeneration, 400, "Generation not found.");

    const [created] = await db
      .insert(facilityStocks)
      .values({
        ...data,
        currentQuantity: data.currentQuantity ?? data.initialQuantity,
      })
      .returning();
    return created;
  },

  async updateFacilityStock(id: string, data: UpdateFacilityStockBody) {
    if (data.facilityId) {
      await assertIdExists(data.facilityId, findFacility, 404, "Facility not found.");
    }
    if (data.varietyId) {
      await assertIdExists(data.varietyId, findVariety, 400, "Variety not found.");
    }
    if (data.sizeId) {
      await assertIdExists(data.sizeId, findSeedSize, 400, "Seed size not found.");
    }
    if (data.generationId) {
      await assertIdExists(data.generationId, findGeneration, 400, "Generation not found.");
    }

    const [updated] = await db
      .update(facilityStocks)
      .set(data)
      .where(eq(facilityStocks.id, id))
      .returning();
    return updated;
  },

  async deleteFacilityStock(id: string) {
    const [deleted] = await db.delete(facilityStocks).where(eq(facilityStocks.id, id)).returning();
    return deleted;
  },

  async deleteAllFacilityStocks() {
    return await db.delete(facilityStocks).returning();
  },
};
