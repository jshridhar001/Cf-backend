import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { stations } from "@/db/schema/masters.js";

export const stationsService = {
  async getAllStations() {
    return await db.query.stations.findMany({
      orderBy: [desc(stations.createdAt)],
    });
  },

  async getStationById(id: string) {
    return await db.query.stations.findFirst({
      where: eq(stations.id, id),
    });
  },

  async createStation(name: string) {
    const [newStation] = await db.insert(stations).values({ name }).returning();
    return newStation;
  },

  async updateStation(id: string, name: string) {
    const [updatedStation] = await db
      .update(stations)
      .set({ name })
      .where(eq(stations.id, id))
      .returning();
    return updatedStation;
  },

  async deleteStation(id: string) {
    const [deletedStation] = await db.delete(stations).where(eq(stations.id, id)).returning();
    return deletedStation;
  },

  async deleteAllStations() {
    // Be very careful with this in production!
    return await db.delete(stations).returning();
  },
};
