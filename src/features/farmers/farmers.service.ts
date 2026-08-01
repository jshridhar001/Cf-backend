import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmerStockBalances } from "@/db/schema/farmer-stock.js";
import { farmerFamilies, farmers } from "@/db/schema/farmers.js";
import { generations, seedSizes, varieties } from "@/db/schema/masters.js";
import {
  dispatches,
  dispatchRequisitionSizeLines,
  dispatchRequisitions,
} from "@/db/schema/seed-dispatch.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";
import type { CreateFarmerBody, UpdateFarmerBody } from "@/features/farmers/farmers.schema.js";
import { parseDecimal, round2 } from "@/features/seed-dispatch/quantity.js";

function toDateOnlyString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapRequisitionStatus(
  status: "PENDING" | "APPROVED" | "REJECTED",
): "pending" | "approved" | "rejected" {
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED") return "rejected";
  return "pending";
}

function mapDispatchStatus(
  status: "IN_TRANSIT" | "DELIVERED" | "NULL",
): "delivering" | "delivered" | "null" {
  if (status === "DELIVERED") return "delivered";
  if (status === "NULL") return "null";
  return "delivering";
}

export const farmersService = {
  // --- Families (read-only for picker) ---
  async getFamilies() {
    return await db.query.farmerFamilies.findMany({
      with: { members: true },
    });
  },

  async getFamilyById(id: string) {
    return await db.query.farmerFamilies.findFirst({
      where: eq(farmerFamilies.id, id),
      with: { members: true },
    });
  },

  // --- Farmers ---
  async createFarmer(data: CreateFarmerBody) {
    return await db.transaction(async (tx) => {
      if (data.accountType === "INDIVIDUAL") {
        const [farmer] = await tx
          .insert(farmers)
          .values({
            name: data.name,
            accountNumber: data.accountNumber,
            mobileNumber: data.mobileNumber,
            aadharNumber: data.aadharNumber,
            panNumber: data.panNumber,
            accountType: data.accountType,
            status: data.status,
            stationId: data.stationId,
            localityId: data.localityId,
            contractUrl: data.contractUrl,
            familyId: null,
          })
          .returning();
        return farmer;
      }

      if (data.accountType === "FAMILY_PRIMARY") {
        const [family] = await tx
          .insert(farmerFamilies)
          .values({
            name: data.familyName,
            accountNumber: data.familyAccountNumber,
            stationId: data.stationId,
            localityId: data.localityId,
          })
          .returning();

        const [farmer] = await tx
          .insert(farmers)
          .values({
            name: data.name,
            accountNumber: data.accountNumber,
            mobileNumber: data.mobileNumber,
            aadharNumber: data.aadharNumber,
            panNumber: data.panNumber,
            accountType: data.accountType,
            status: data.status,
            stationId: data.stationId,
            localityId: data.localityId,
            contractUrl: data.contractUrl,
            familyId: family.id,
          })
          .returning();
        return farmer;
      }

      // FAMILY_MEMBER
      const family = await tx.query.farmerFamilies.findFirst({
        where: eq(farmerFamilies.id, data.familyId),
      });
      if (!family) throw new Error("Linked Family not found");

      if (family.stationId !== data.stationId || family.localityId !== data.localityId) {
        throw new Error(
          "Farmer's station and locality must match the parent family's station and locality",
        );
      }

      const [farmer] = await tx
        .insert(farmers)
        .values({
          name: data.name,
          accountNumber: data.accountNumber,
          mobileNumber: data.mobileNumber,
          aadharNumber: data.aadharNumber,
          panNumber: data.panNumber,
          accountType: data.accountType,
          status: data.status,
          stationId: data.stationId,
          localityId: data.localityId,
          contractUrl: data.contractUrl,
          familyId: data.familyId,
        })
        .returning();
      return farmer;
    });
  },

  async getFarmers() {
    return await db.query.farmers.findMany({
      with: {
        family: true,
        station: true,
        locality: true,
      },
    });
  },

  async getFarmerById(id: string) {
    return await db.query.farmers.findFirst({
      where: eq(farmers.id, id),
      with: {
        family: true,
        station: true,
        locality: true,
      },
    });
  },

  async getFarmerProfile(id: string) {
    const farmer = await this.getFarmerById(id);
    if (!farmer) return null;

    const [stockRows, requisitionRows, dispatchRows] = await Promise.all([
      db
        .select({
          id: farmerStockBalances.id,
          varietyName: varieties.name,
          sizeName: seedSizes.name,
          generationName: generations.name,
          balance: farmerStockBalances.balance,
        })
        .from(farmerStockBalances)
        .innerJoin(varieties, eq(farmerStockBalances.varietyId, varieties.id))
        .innerJoin(seedSizes, eq(farmerStockBalances.sizeId, seedSizes.id))
        .innerJoin(generations, eq(farmerStockBalances.generationId, generations.id))
        .where(eq(farmerStockBalances.farmerId, id))
        .orderBy(asc(varieties.name), asc(generations.name), asc(seedSizes.name)),
      db
        .select({
          id: seedRequisitions.id,
          status: seedRequisitions.status,
          varietyName: varieties.name,
          requestedAcres: seedRequisitions.requestedAcres,
          requestedBags: seedRequisitions.requestedBags,
          requisitionDate: seedRequisitions.requisitionDate,
          requestedDeliveryDate: seedRequisitions.requestedDeliveryDate,
        })
        .from(seedRequisitions)
        .innerJoin(varieties, eq(seedRequisitions.varietyId, varieties.id))
        .where(eq(seedRequisitions.farmerId, id))
        .orderBy(desc(seedRequisitions.requisitionDate)),
      db
        .select({
          dispatchId: dispatches.id,
          status: dispatches.status,
          dispatchDate: dispatches.dispatchDate,
          destination: dispatches.toLocation,
          truckNumber: dispatches.truckNumber,
          createdAt: dispatches.createdAt,
          requisitionId: seedRequisitions.id,
          requestedAcres: seedRequisitions.requestedAcres,
          bagQuantity: dispatchRequisitionSizeLines.bagQuantity,
        })
        .from(dispatches)
        .innerJoin(dispatchRequisitions, eq(dispatchRequisitions.dispatchId, dispatches.id))
        .innerJoin(seedRequisitions, eq(dispatchRequisitions.requisitionId, seedRequisitions.id))
        .leftJoin(
          dispatchRequisitionSizeLines,
          eq(dispatchRequisitionSizeLines.dispatchRequisitionId, dispatchRequisitions.id),
        )
        .where(eq(seedRequisitions.farmerId, id))
        .orderBy(desc(dispatches.dispatchDate), desc(dispatches.createdAt)),
    ]);

    const stock = stockRows.map((row) => ({
      id: row.id,
      varietyName: row.varietyName,
      sizeName: row.sizeName,
      generationName: row.generationName,
      balance: round2(parseDecimal(row.balance)),
    }));

    const requisitions = requisitionRows.map((row) => ({
      id: row.id,
      status: mapRequisitionStatus(row.status),
      varietyName: row.varietyName,
      acres: row.requestedAcres != null ? round2(parseDecimal(row.requestedAcres)) : 0,
      seedBags: row.requestedBags ?? 0,
      requisitionDate: toDateOnlyString(row.requisitionDate) ?? "",
      requestedDeliveryDate: toDateOnlyString(row.requestedDeliveryDate) ?? "",
    }));

    type DispatchAgg = {
      id: string;
      status: "delivering" | "delivered" | "null";
      dispatchDate: string;
      destination: string;
      truckNumber: string;
      createdAt: Date;
      seedBags: number;
      acres: number;
      requisitionIds: Set<string>;
    };

    const dispatchAgg = new Map<string, DispatchAgg>();
    for (const row of dispatchRows) {
      let agg = dispatchAgg.get(row.dispatchId);
      if (!agg) {
        agg = {
          id: row.dispatchId,
          status: mapDispatchStatus(row.status),
          dispatchDate: toDateOnlyString(row.dispatchDate) ?? "",
          destination: row.destination,
          truckNumber: row.truckNumber,
          createdAt: row.createdAt,
          seedBags: 0,
          acres: 0,
          requisitionIds: new Set(),
        };
        dispatchAgg.set(row.dispatchId, agg);
      }

      if (row.bagQuantity != null) {
        agg.seedBags = round2(agg.seedBags + row.bagQuantity);
      }

      if (!agg.requisitionIds.has(row.requisitionId)) {
        agg.requisitionIds.add(row.requisitionId);
        const acres = row.requestedAcres != null ? round2(parseDecimal(row.requestedAcres)) : 0;
        agg.acres = round2(agg.acres + acres);
      }
    }

    const farmerDispatches = Array.from(dispatchAgg.values())
      .sort((a, b) => {
        const dateCmp = b.dispatchDate.localeCompare(a.dispatchDate);
        if (dateCmp !== 0) return dateCmp;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .map((agg) => ({
        id: agg.id,
        status: agg.status,
        dispatchDate: agg.dispatchDate,
        destination: agg.destination,
        truckNumber: agg.truckNumber,
        seedBags: agg.seedBags,
        acres: agg.acres,
      }));

    const fields: Array<{ id: string; name: string; acres: number; geoLocation: string | null }> =
      [];

    const metrics = {
      totalStockBags: round2(stock.reduce((sum, row) => sum + row.balance, 0)),
      requisitionTotal: requisitions.length,
      requisitionPending: requisitions.filter((row) => row.status === "pending").length,
      requisitionApproved: requisitions.filter((row) => row.status === "approved").length,
      requisitionRejected: requisitions.filter((row) => row.status === "rejected").length,
      dispatchTotal: farmerDispatches.length,
      dispatchDelivering: farmerDispatches.filter((row) => row.status === "delivering").length,
      dispatchDelivered: farmerDispatches.filter((row) => row.status === "delivered").length,
      fieldCount: 0,
      totalAcres: 0,
    };

    return {
      farmer,
      fields,
      stock,
      requisitions,
      dispatches: farmerDispatches,
      metrics,
    };
  },

  async updateFarmer(id: string, data: UpdateFarmerBody) {
    return await db.transaction(async (tx) => {
      const existing = await tx.query.farmers.findFirst({
        where: eq(farmers.id, id),
        with: { family: true },
      });
      if (!existing) return undefined;

      const { familyName, familyAccountNumber, ...farmerFields } = data;

      const merged = {
        stationId: farmerFields.stationId ?? existing.stationId,
        localityId: farmerFields.localityId ?? existing.localityId,
        familyId: farmerFields.familyId === undefined ? existing.familyId : farmerFields.familyId,
        accountType: farmerFields.accountType ?? existing.accountType,
      };

      if (merged.accountType !== "INDIVIDUAL" && !merged.familyId) {
        throw new Error("familyId is required when accountType is not INDIVIDUAL");
      }

      if (merged.familyId) {
        const family = await tx.query.farmerFamilies.findFirst({
          where: eq(farmerFamilies.id, merged.familyId),
        });
        if (!family) throw new Error("Linked Family not found");

        if (family.stationId !== merged.stationId || family.localityId !== merged.localityId) {
          const willSyncFamily =
            existing.accountType === "FAMILY_PRIMARY" &&
            existing.familyId === merged.familyId &&
            (farmerFields.stationId !== undefined || farmerFields.localityId !== undefined);

          if (!willSyncFamily) {
            throw new Error(
              "Farmer's station and locality must match the parent family's station and locality",
            );
          }
        }
      }

      const hasFarmerUpdates = Object.values(farmerFields).some((v) => v !== undefined);
      if (hasFarmerUpdates) {
        await tx.update(farmers).set(farmerFields).where(eq(farmers.id, id));
      }

      if (
        existing.accountType === "FAMILY_PRIMARY" &&
        existing.familyId &&
        (familyName !== undefined ||
          familyAccountNumber !== undefined ||
          farmerFields.stationId !== undefined ||
          farmerFields.localityId !== undefined)
      ) {
        await tx
          .update(farmerFamilies)
          .set({
            ...(familyName !== undefined ? { name: familyName } : {}),
            ...(familyAccountNumber !== undefined ? { accountNumber: familyAccountNumber } : {}),
            ...(farmerFields.stationId !== undefined ? { stationId: farmerFields.stationId } : {}),
            ...(farmerFields.localityId !== undefined
              ? { localityId: farmerFields.localityId }
              : {}),
          })
          .where(eq(farmerFamilies.id, existing.familyId));
      }

      const [farmer] = await tx.select().from(farmers).where(eq(farmers.id, id)).limit(1);
      return farmer;
    });
  },

  async deleteFarmer(id: string) {
    const [deleted] = await db.delete(farmers).where(eq(farmers.id, id)).returning();
    return deleted;
  },

  async deleteAllFarmers() {
    return await db.delete(farmers).returning();
  },
};
