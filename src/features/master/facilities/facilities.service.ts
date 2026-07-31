import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { facilities } from "@/db/schema/masters.js";
import type {
  CreateFacilityBody,
  UpdateFacilityBody,
} from "@/features/master/facilities/facilites.schema.js";

export const facilitiesService = {
  async getAllFacilities() {
    return await db.query.facilities.findMany({
      orderBy: [desc(facilities.createdAt)],
    });
  },

  async getFacilityById(id: string) {
    return await db.query.facilities.findFirst({
      where: eq(facilities.id, id),
    });
  },

  async createFacility(data: CreateFacilityBody) {
    const [newFacility] = await db
      .insert(facilities)
      .values({
        name: data.name,
        usedIn: data.usedIn,
      })
      .returning();
    return newFacility;
  },

  async updateFacility(id: string, data: UpdateFacilityBody) {
    const [updatedFacility] = await db
      .update(facilities)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.usedIn && { usedIn: data.usedIn }),
      })
      .where(eq(facilities.id, id))
      .returning();
    return updatedFacility;
  },

  async deleteFacility(id: string) {
    const [deletedFacility] = await db.delete(facilities).where(eq(facilities.id, id)).returning();
    return deletedFacility;
  },

  async deleteAllFacilities() {
    return await db.delete(facilities).returning();
  },
};
