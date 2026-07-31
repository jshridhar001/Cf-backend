import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { localities } from "@/db/schema/masters.js";
import type {
  CreateLocalityBody,
  UpdateLocalityBody,
} from "@/features/master/localities/localities.schema.js";

export const localitiesService = {
  async getAllLocalities() {
    return await db.query.localities.findMany({
      orderBy: [desc(localities.createdAt)],
      // Automatically join the parent station so the UI can display "Locality Name (Station Name)"
      with: {
        station: true,
      },
    });
  },

  async getLocalityById(id: string) {
    return await db.query.localities.findFirst({
      where: eq(localities.id, id),
      with: {
        station: true,
      },
    });
  },

  async createLocality(data: CreateLocalityBody) {
    const [newLocality] = await db.insert(localities).values(data).returning();
    return newLocality;
  },

  async updateLocality(id: string, data: UpdateLocalityBody) {
    const [updatedLocality] = await db
      .update(localities)
      .set(data)
      .where(eq(localities.id, id))
      .returning();
    return updatedLocality;
  },

  async deleteLocality(id: string) {
    const [deletedLocality] = await db.delete(localities).where(eq(localities.id, id)).returning();
    return deletedLocality;
  },

  async deleteAllLocalities() {
    return await db.delete(localities).returning();
  },
};
