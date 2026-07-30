import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { generations } from "@/db/schema/masters.js";

export const generationsService = {
  async getAllGenerations() {
    return await db.query.generations.findMany({
      orderBy: [desc(generations.createdAt)],
    });
  },

  async getGenerationById(id: string) {
    return await db.query.generations.findFirst({
      where: eq(generations.id, id),
    });
  },

  async createGeneration(name: string) {
    const [newGeneration] = await db.insert(generations).values({ name }).returning();
    return newGeneration;
  },

  async updateGeneration(id: string, name: string) {
    const [updatedGeneration] = await db
      .update(generations)
      .set({ name })
      .where(eq(generations.id, id))
      .returning();
    return updatedGeneration;
  },

  async deleteGeneration(id: string) {
    const [deletedGeneration] = await db
      .delete(generations)
      .where(eq(generations.id, id))
      .returning();
    return deletedGeneration;
  },

  async deleteAllGenerations() {
    // Be very careful with this in production!
    return await db.delete(generations).returning();
  },
};
