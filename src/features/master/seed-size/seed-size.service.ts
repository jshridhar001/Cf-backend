import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { seedSizes } from "@/db/schema/masters.js";
import type {
  CreateSeedSizeBody,
  UpdateSeedSizeBody,
} from "@/features/master/seed-size/seed-size.schema.js";

export const seedSizesService = {
  async getAllSeedSizes() {
    return await db.query.seedSizes.findMany({
      orderBy: [desc(seedSizes.createdAt)],
    });
  },

  async getSeedSizeById(id: string) {
    return await db.query.seedSizes.findFirst({
      where: eq(seedSizes.id, id),
    });
  },

  async createSeedSize(data: CreateSeedSizeBody) {
    const [newSize] = await db.insert(seedSizes).values(data).returning();
    return newSize;
  },

  async updateSeedSize(id: string, data: UpdateSeedSizeBody) {
    const [updatedSize] = await db
      .update(seedSizes)
      .set(data)
      .where(eq(seedSizes.id, id))
      .returning();
    return updatedSize;
  },

  async deleteSeedSize(id: string) {
    const [deletedSize] = await db.delete(seedSizes).where(eq(seedSizes.id, id)).returning();
    return deletedSize;
  },

  async deleteAllSeedSizes() {
    return await db.delete(seedSizes).returning();
  },
};
