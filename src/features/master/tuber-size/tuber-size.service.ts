import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { tuberSizes } from "@/db/schema/masters.js";

export const tuberSizesService = {
  async getAllTuberSizes() {
    return await db.query.tuberSizes.findMany({
      orderBy: [desc(tuberSizes.createdAt)],
    });
  },

  async getTuberSizeById(id: string) {
    return await db.query.tuberSizes.findFirst({
      where: eq(tuberSizes.id, id),
    });
  },

  async createTuberSize(name: string) {
    const [newTuberSize] = await db.insert(tuberSizes).values({ name }).returning();
    return newTuberSize;
  },

  async updateTuberSize(id: string, name: string) {
    const [updatedTuberSize] = await db
      .update(tuberSizes)
      .set({ name })
      .where(eq(tuberSizes.id, id))
      .returning();
    return updatedTuberSize;
  },

  async deleteTuberSize(id: string) {
    const [deletedTuberSize] = await db.delete(tuberSizes).where(eq(tuberSizes.id, id)).returning();
    return deletedTuberSize;
  },

  async deleteAllTuberSizes() {
    return await db.delete(tuberSizes).returning();
  },
};
