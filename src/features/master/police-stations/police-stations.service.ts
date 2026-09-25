import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { policeStations } from "@/db/schema/masters.js";

export const policeStationsService = {
  async getAllPoliceStations() {
    return await db.query.policeStations.findMany({
      orderBy: [desc(policeStations.createdAt)],
    });
  },

  async getPoliceStationById(id: string) {
    return await db.query.policeStations.findFirst({
      where: eq(policeStations.id, id),
    });
  },

  async createPoliceStation(name: string) {
    const [newPoliceStation] = await db.insert(policeStations).values({ name }).returning();
    return newPoliceStation;
  },

  async updatePoliceStation(id: string, name: string) {
    const [updatedPoliceStation] = await db
      .update(policeStations)
      .set({ name })
      .where(eq(policeStations.id, id))
      .returning();
    return updatedPoliceStation;
  },

  async deletePoliceStation(id: string) {
    const [deletedPoliceStation] = await db
      .delete(policeStations)
      .where(eq(policeStations.id, id))
      .returning();
    return deletedPoliceStation;
  },

  async deleteAllPoliceStations() {
    // Be very careful with this in production!
    return await db.delete(policeStations).returning();
  },
};
