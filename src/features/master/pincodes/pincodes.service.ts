import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { pincodes } from "@/db/schema/masters.js";

export const pincodesService = {
  async getAllPincodes() {
    return await db.query.pincodes.findMany({
      orderBy: [desc(pincodes.createdAt)],
    });
  },

  async getPincodeById(id: string) {
    return await db.query.pincodes.findFirst({
      where: eq(pincodes.id, id),
    });
  },

  async createPincode(name: string) {
    const [newPincode] = await db.insert(pincodes).values({ name }).returning();
    return newPincode;
  },

  async updatePincode(id: string, name: string) {
    const [updatedPincode] = await db
      .update(pincodes)
      .set({ name })
      .where(eq(pincodes.id, id))
      .returning();
    return updatedPincode;
  },

  async deletePincode(id: string) {
    const [deletedPincode] = await db.delete(pincodes).where(eq(pincodes.id, id)).returning();
    return deletedPincode;
  },

  async deleteAllPincodes() {
    // Be very careful with this in production!
    return await db.delete(pincodes).returning();
  },
};
