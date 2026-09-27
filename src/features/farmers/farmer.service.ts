import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmers } from "@/db/schema/farmer.js";
import {
  districts,
  pincodes,
  policeStations,
  postOffices,
  states,
  stations,
  villages,
} from "@/db/schema/masters.js";
import type { CreateFarmerBody } from "@/features/farmers/farmer.schema.js";

const farmerAddressWith = {
  state: true,
  district: true,
  station: true,
  policeStation: true,
  pincode: true,
  postOffice: true,
  village: true,
} as const;

export const farmersService = {
  async getAllFarmers() {
    return await db.query.farmers.findMany({
      orderBy: [desc(farmers.createdAt)],
      with: {
        ...farmerAddressWith,
        seedRequisitions: {
          orderBy: (seedRequisitions, { desc }) => [desc(seedRequisitions.createdAt)],
          with: {
            variety: true,
          },
        },
      },
    });
  },

  async createFarmer(data: CreateFarmerBody) {
    const [created] = await db.insert(farmers).values(data).returning({ id: farmers.id });

    return await db.query.farmers.findFirst({
      where: eq(farmers.id, created.id),
      with: farmerAddressWith,
    });
  },

  async updateFarmer(id: string, data: CreateFarmerBody) {
    const [updated] = await db
      .update(farmers)
      .set(data)
      .where(eq(farmers.id, id))
      .returning({ id: farmers.id });

    if (!updated) {
      return undefined;
    }

    return await db.query.farmers.findFirst({
      where: eq(farmers.id, updated.id),
      with: farmerAddressWith,
    });
  },

  async deleteFarmer(id: string) {
    const [deleted] = await db
      .delete(farmers)
      .where(eq(farmers.id, id))
      .returning({ id: farmers.id });
    return deleted;
  },

  async deleteAllFarmers() {
    return await db.delete(farmers).returning({ id: farmers.id });
  },

  async getAddressOptions() {
    const [
      stateRows,
      districtRows,
      stationRows,
      policeStationRows,
      pincodeRows,
      postOfficeRows,
      villageRows,
    ] = await Promise.all([
      db.select({ id: states.id, name: states.name }).from(states).orderBy(asc(states.name)),
      db
        .select({ id: districts.id, name: districts.name })
        .from(districts)
        .orderBy(asc(districts.name)),
      db
        .select({ id: stations.id, name: stations.name })
        .from(stations)
        .orderBy(asc(stations.name)),
      db
        .select({ id: policeStations.id, name: policeStations.name })
        .from(policeStations)
        .orderBy(asc(policeStations.name)),
      db
        .select({ id: pincodes.id, name: pincodes.name })
        .from(pincodes)
        .orderBy(asc(pincodes.name)),
      db
        .select({ id: postOffices.id, name: postOffices.name })
        .from(postOffices)
        .orderBy(asc(postOffices.name)),
      db
        .select({ id: villages.id, name: villages.name })
        .from(villages)
        .orderBy(asc(villages.name)),
    ]);

    return {
      states: stateRows,
      districts: districtRows,
      stations: stationRows,
      policeStations: policeStationRows,
      pincodes: pincodeRows,
      postOffices: postOfficeRows,
      villages: villageRows,
    };
  },
};
