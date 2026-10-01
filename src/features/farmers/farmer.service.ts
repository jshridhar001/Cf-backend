import { asc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmerFamilies, farmers } from "@/db/schema/farmer.js";
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
  family: true,
  state: true,
  district: true,
  station: true,
  policeStation: true,
  pincode: true,
  postOffice: true,
  village: true,
} as const;

type FarmerFamilyLink = {
  familyId: string | null;
  accountType: "INDIVIDUAL" | "FAMILY_PRIMARY" | "FAMILY_MEMBER";
};

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function toFarmerValues(data: CreateFarmerBody, familyId: string | null) {
  const columns = { ...data };
  delete columns.familyName;
  delete columns.familyAccountNumber;
  delete columns.familyId;
  return { ...columns, familyId };
}

async function resolveFamilyId(
  tx: DbTransaction,
  data: CreateFarmerBody,
  existing?: FarmerFamilyLink,
) {
  if (!data.accountType) {
    return existing?.familyId ?? null;
  }

  if (data.accountType === "INDIVIDUAL") {
    return null;
  }

  if (data.accountType === "FAMILY_MEMBER") {
    return data.familyId ?? null;
  }

  const name = data.familyName?.trim() ?? "";
  const accountNumber = data.familyAccountNumber?.trim() ?? "";
  const reuseFamilyId =
    existing?.accountType === "FAMILY_PRIMARY" && existing.familyId ? existing.familyId : null;

  if (reuseFamilyId) {
    await tx
      .update(farmerFamilies)
      .set({ name, accountNumber, stationId: data.stationId })
      .where(eq(farmerFamilies.id, reuseFamilyId));
    return reuseFamilyId;
  }

  const [created] = await tx
    .insert(farmerFamilies)
    .values({ name, accountNumber, stationId: data.stationId })
    .returning({ id: farmerFamilies.id });

  return created.id;
}

export const farmersService = {
  async getAllFarmers() {
    return await db.query.farmers.findMany({
      orderBy: [asc(farmers.name)],
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

  async getFamilies() {
    return await db
      .select({
        id: farmerFamilies.id,
        name: farmerFamilies.name,
        accountNumber: farmerFamilies.accountNumber,
        stationId: farmerFamilies.stationId,
      })
      .from(farmerFamilies)
      .orderBy(asc(farmerFamilies.name));
  },

  async createFarmer(data: CreateFarmerBody) {
    const createdId = await db.transaction(async (tx) => {
      const familyId = await resolveFamilyId(tx, data);
      const [created] = await tx
        .insert(farmers)
        .values(toFarmerValues(data, familyId))
        .returning({ id: farmers.id });
      return created.id;
    });

    return await db.query.farmers.findFirst({
      where: eq(farmers.id, createdId),
      with: farmerAddressWith,
    });
  },

  async updateFarmer(id: string, data: CreateFarmerBody) {
    const updatedId = await db.transaction(async (tx) => {
      const existing = await tx.query.farmers.findFirst({
        where: eq(farmers.id, id),
        columns: { id: true, familyId: true, accountType: true },
      });

      if (!existing) {
        return undefined;
      }

      const familyId = await resolveFamilyId(tx, data, existing);
      await tx.update(farmers).set(toFarmerValues(data, familyId)).where(eq(farmers.id, id));
      return id;
    });

    if (!updatedId) {
      return undefined;
    }

    return await db.query.farmers.findFirst({
      where: eq(farmers.id, updatedId),
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
