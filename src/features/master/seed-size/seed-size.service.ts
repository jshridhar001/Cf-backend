import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { seedSizes } from "@/db/schema/masters.js";
import type {
  CreateSeedSizeBody,
  UpdateSeedSizeBody,
} from "@/features/master/seed-size/seed-size.schema.js";

const seedSizeWith = {
  variety: true,
} as const;

async function findSeedSizeWithVariety(id: string) {
  return await db.query.seedSizes.findFirst({
    where: eq(seedSizes.id, id),
    with: seedSizeWith,
  });
}

export const seedSizesService = {
  async getAllSeedSizes(varietyId?: string) {
    return await db.query.seedSizes.findMany({
      where: varietyId ? eq(seedSizes.varietyId, varietyId) : undefined,
      orderBy: [desc(seedSizes.createdAt)],
      with: seedSizeWith,
    });
  },

  async getSeedSizeById(id: string) {
    return await findSeedSizeWithVariety(id);
  },

  async createSeedSize(data: CreateSeedSizeBody) {
    const [newSize] = await db.insert(seedSizes).values(data).returning({ id: seedSizes.id });
    if (!newSize) {
      return undefined;
    }
    return await findSeedSizeWithVariety(newSize.id);
  },

  async updateSeedSize(id: string, data: UpdateSeedSizeBody) {
    const [updatedSize] = await db
      .update(seedSizes)
      .set(data)
      .where(eq(seedSizes.id, id))
      .returning({ id: seedSizes.id });
    if (!updatedSize) {
      return undefined;
    }
    return await findSeedSizeWithVariety(updatedSize.id);
  },

  async deleteSeedSize(id: string) {
    const [deletedSize] = await db.delete(seedSizes).where(eq(seedSizes.id, id)).returning();
    return deletedSize;
  },

  async deleteAllSeedSizes() {
    return await db.delete(seedSizes).returning();
  },
};
