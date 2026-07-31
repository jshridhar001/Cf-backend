import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { stations } from "@/db/schema/masters.js";
import type {
  CreateStationBody,
  UpdateStationBody,
} from "@/features/master/stations/stations.schema.js";

export const stationsService = {
  async getAllStations() {
    return await db.query.stations.findMany({
      orderBy: [desc(stations.createdAt)],
      with: {
        localities: true,
      },
    });
  },

  async getStationById(id: string) {
    return await db.query.stations.findFirst({
      where: eq(stations.id, id),
      with: {
        localities: true,
      },
    });
  },

  async createStation(data: CreateStationBody) {
    const [newStation] = await db.insert(stations).values(data).returning();
    return newStation;
  },

  async updateStation(id: string, data: UpdateStationBody) {
    const [updatedStation] = await db
      .update(stations)
      .set(data)
      .where(eq(stations.id, id))
      .returning();
    return updatedStation;
  },

  async deleteStation(id: string) {
    // onDelete: "cascade" on localities.stationId removes child localities
    const [deletedStation] = await db.delete(stations).where(eq(stations.id, id)).returning();
    return deletedStation;
  },

  async deleteAllStations() {
    return await db.delete(stations).returning();
  },
};
