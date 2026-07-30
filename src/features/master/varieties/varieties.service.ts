import { desc, eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { varieties } from "../../../db/schema/masters.js";

export const varietiesService = {
  async getAllVarieties() {
    return await db.query.varieties.findMany({
      orderBy: [desc(varieties.createdAt)],
    });
  },

  async getVarietyById(id: string) {
    return await db.query.varieties.findFirst({
      where: eq(varieties.id, id),
    });
  },

  async createVariety(name: string) {
    const [newVariety] = await db.insert(varieties).values({ name }).returning();
    return newVariety;
  },

  async updateVariety(id: string, name: string) {
    const [updatedVariety] = await db
      .update(varieties)
      .set({ name })
      .where(eq(varieties.id, id))
      .returning();
    return updatedVariety;
  },

  async deleteVariety(id: string) {
    const [deletedVariety] = await db.delete(varieties).where(eq(varieties.id, id)).returning();
    return deletedVariety;
  },

  async deleteAllVarieties() {
    // Be very careful with this in production!
    return await db.delete(varieties).returning();
  },
};
