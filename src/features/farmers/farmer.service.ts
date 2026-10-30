import { and, asc, eq, ne, type SQL, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/index.js";
import { farmerFamilies, farmers } from "@/db/schema/farmer.js";
import { farmerStockBalances } from "@/db/schema/farmer-stock.js";
import {
  districts,
  generations,
  pincodes,
  policeStations,
  postOffices,
  seedSizes,
  states,
  stations,
  varieties,
  villages,
} from "@/db/schema/masters.js";
import {
  dispatches,
  dispatchRequisitionSizeLines,
  dispatchRequisitions,
} from "@/db/schema/seed-dispatch.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";
import type { CreateFarmerBody, FarmerReportQuery } from "@/features/farmers/farmer.schema.js";
import { buildFarmerSeedReportRow } from "@/features/farmers/farmer-report.js";

const expectedSeedSizes = alias(seedSizes, "expected_seed_size");

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
            deliveries: {
              orderBy: (deliveries, { asc }) => [asc(deliveries.deliveryDate)],
            },
          },
        },
      },
    });
  },

  async getFarmerStock(farmerId: string) {
    const [farmer] = await db
      .select({ id: farmers.id })
      .from(farmers)
      .where(eq(farmers.id, farmerId))
      .limit(1);

    if (!farmer) return null;

    return await db
      .select({
        id: farmerStockBalances.id,
        farmerId: farmerStockBalances.farmerId,
        varietyId: farmerStockBalances.varietyId,
        sizeId: farmerStockBalances.sizeId,
        generationId: farmerStockBalances.generationId,
        balance: farmerStockBalances.balance,
        createdAt: farmerStockBalances.createdAt,
        updatedAt: farmerStockBalances.updatedAt,
        variety: {
          id: varieties.id,
          name: varieties.name,
        },
        size: {
          id: seedSizes.id,
          name: seedSizes.name,
          seedBagsPerAcre: seedSizes.seedBagsPerAcre,
        },
        generation: {
          id: generations.id,
          name: generations.name,
        },
      })
      .from(farmerStockBalances)
      .innerJoin(varieties, eq(varieties.id, farmerStockBalances.varietyId))
      .innerJoin(seedSizes, eq(seedSizes.id, farmerStockBalances.sizeId))
      .innerJoin(generations, eq(generations.id, farmerStockBalances.generationId))
      .where(eq(farmerStockBalances.farmerId, farmerId))
      .orderBy(asc(varieties.name), asc(seedSizes.name), asc(generations.name));
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

  async getSeedReport(query: FarmerReportQuery) {
    const conditions = reportConditions(query);
    const requisitionWhere = combineConditions(conditions);
    const sizeWhere = combineConditions([ne(dispatches.status, "NULL"), ...conditions]);

    const requisitionQuery = db
      .select({
        requisitionId: seedRequisitions.id,
        status: seedRequisitions.status,
        requisitionDate: seedRequisitions.requisitionDate,
        contractDate: seedRequisitions.contractDate,
        requestedBags: seedRequisitions.requestedBags,
        requestedAcres: seedRequisitions.requestedAcres,
        farmerId: farmers.id,
        farmerName: farmers.name,
        accountNumber: farmers.accountNumber,
        stationId: stations.id,
        stationName: stations.name,
        familyId: farmerFamilies.id,
        familyName: farmerFamilies.name,
        varietyId: varieties.id,
        varietyName: varieties.name,
        expectedSizeId: expectedSeedSizes.id,
        expectedSizeName: expectedSeedSizes.name,
        expectedSeedBagsPerAcre: expectedSeedSizes.seedBagsPerAcre,
      })
      .from(seedRequisitions)
      .innerJoin(farmers, eq(seedRequisitions.farmerId, farmers.id))
      .innerJoin(stations, eq(farmers.stationId, stations.id))
      .innerJoin(varieties, eq(seedRequisitions.varietyId, varieties.id))
      .leftJoin(farmerFamilies, eq(farmers.familyId, farmerFamilies.id))
      .leftJoin(expectedSeedSizes, eq(seedRequisitions.expectedSizeId, expectedSeedSizes.id));

    const filteredRequisitions = requisitionWhere
      ? requisitionQuery.where(requisitionWhere)
      : requisitionQuery;

    const sizeQuery = db
      .select({
        requisitionId: dispatchRequisitions.requisitionId,
        sizeId: seedSizes.id,
        sizeName: seedSizes.name,
        seedBagsPerAcre: seedSizes.seedBagsPerAcre,
        bags: sum(dispatchRequisitionSizeLines.bagQuantity),
      })
      .from(dispatchRequisitionSizeLines)
      .innerJoin(
        dispatchRequisitions,
        eq(dispatchRequisitionSizeLines.dispatchRequisitionId, dispatchRequisitions.id),
      )
      .innerJoin(dispatches, eq(dispatchRequisitions.dispatchId, dispatches.id))
      .innerJoin(seedSizes, eq(dispatchRequisitionSizeLines.sizeId, seedSizes.id))
      .innerJoin(seedRequisitions, eq(dispatchRequisitions.requisitionId, seedRequisitions.id))
      .innerJoin(farmers, eq(seedRequisitions.farmerId, farmers.id))
      .where(sizeWhere)
      .groupBy(
        dispatchRequisitions.requisitionId,
        seedSizes.id,
        seedSizes.name,
        seedSizes.seedBagsPerAcre,
      );

    const [requisitionRows, sizeRows] = await Promise.all([
      filteredRequisitions.orderBy(
        asc(farmers.name),
        asc(farmers.accountNumber),
        asc(varieties.name),
        asc(seedRequisitions.contractDate),
        asc(seedRequisitions.id),
      ),
      sizeQuery,
    ]);

    const sizesByRequisition = new Map<
      string,
      { sizeId: string; sizeName: string; seedBagsPerAcre: number | null; bags: number }[]
    >();
    for (const row of sizeRows) {
      const sizes = sizesByRequisition.get(row.requisitionId) ?? [];
      sizes.push({
        sizeId: row.sizeId,
        sizeName: row.sizeName,
        seedBagsPerAcre: row.seedBagsPerAcre,
        bags: bagCount(row.bags),
      });
      sizesByRequisition.set(row.requisitionId, sizes);
    }

    return requisitionRows.map((row) =>
      buildFarmerSeedReportRow(
        {
          requisitionId: row.requisitionId,
          status: row.status,
          requisitionDate: row.requisitionDate,
          contractDate: row.contractDate,
          farmer: {
            id: row.farmerId,
            name: row.farmerName,
            accountNumber: row.accountNumber,
            station: { id: row.stationId, name: row.stationName },
            family:
              row.familyId != null && row.familyName != null
                ? { id: row.familyId, name: row.familyName }
                : null,
          },
          variety: { id: row.varietyId, name: row.varietyName },
          expectedSize:
            row.expectedSizeId != null && row.expectedSizeName != null
              ? {
                  id: row.expectedSizeId,
                  name: row.expectedSizeName,
                  seedBagsPerAcre: row.expectedSeedBagsPerAcre,
                }
              : null,
          requestedBags: row.requestedBags,
          requestedAcres: row.requestedAcres,
        },
        sizesByRequisition.get(row.requisitionId) ?? [],
      ),
    );
  },
};

function reportConditions(query: FarmerReportQuery): SQL[] {
  const conditions: SQL[] = [];
  if (query.stationId) conditions.push(eq(farmers.stationId, query.stationId));
  if (query.farmerId) conditions.push(eq(seedRequisitions.farmerId, query.farmerId));
  if (query.varietyId) conditions.push(eq(seedRequisitions.varietyId, query.varietyId));
  if (query.status) conditions.push(eq(seedRequisitions.status, query.status));
  return conditions;
}

function combineConditions(conditions: SQL[]): SQL | undefined {
  const [first, ...rest] = conditions;
  if (!first) return undefined;
  return rest.reduce<SQL>((current, condition) => and(current, condition) ?? current, first);
}

function bagCount(value: string | null): number {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
