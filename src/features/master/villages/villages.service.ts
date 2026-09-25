import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { villages } from "@/db/schema/masters.js";

export const villagesService = {
  async getAllVillages() {
    return await db.query.villages.findMany({
      orderBy: [desc(villages.createdAt)],
    });
  },

  async getVillageById(id: string) {
    return await db.query.villages.findFirst({
      where: eq(villages.id, id),
    });
  },

  async createVillage(name: string) {
    const [newVillage] = await db.insert(villages).values({ name }).returning();
    return newVillage;
  },

  async updateVillage(id: string, name: string) {
    const [updatedVillage] = await db
      .update(villages)
      .set({ name })
      .where(eq(villages.id, id))
      .returning();
    return updatedVillage;
  },

  async deleteVillage(id: string) {
    const [deletedVillage] = await db.delete(villages).where(eq(villages.id, id)).returning();
    return deletedVillage;
  },

  async deleteAllVillages() {
    // Be very careful with this in production!
    return await db.delete(villages).returning();
  },
};
