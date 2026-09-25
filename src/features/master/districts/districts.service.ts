import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { districts } from "@/db/schema/masters.js";

export const districtsService = {
  async getAllDistricts() {
    return await db.query.districts.findMany({
      orderBy: [desc(districts.createdAt)],
    });
  },

  async getDistrictById(id: string) {
    return await db.query.districts.findFirst({
      where: eq(districts.id, id),
    });
  },

  async createDistrict(name: string) {
    const [newDistrict] = await db.insert(districts).values({ name }).returning();
    return newDistrict;
  },

  async updateDistrict(id: string, name: string) {
    const [updatedDistrict] = await db
      .update(districts)
      .set({ name })
      .where(eq(districts.id, id))
      .returning();
    return updatedDistrict;
  },

  async deleteDistrict(id: string) {
    const [deletedDistrict] = await db.delete(districts).where(eq(districts.id, id)).returning();
    return deletedDistrict;
  },

  async deleteAllDistricts() {
    // Be very careful with this in production!
    return await db.delete(districts).returning();
  },
};
