import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmerContracts, farmerFamilies, farmers } from "@/db/schema/farmers.js";
import type {
  CreateFarmerBody,
  CreateFarmerContractBody,
  UpdateFarmerBody,
  UpdateFarmerContractBody,
} from "@/features/farmers/farmers.schema.js";

const farmerDetailRelations = {
  family: {
    with: {
      station: true,
      locality: true,
    },
  },
  station: true,
  locality: true,
  contracts: true,
} as const;

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
            bankName: data.bankName,
            ifscCode: data.ifscCode,
            bankAccountNumber: data.bankAccountNumber,
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
            bankName: data.bankName,
            ifscCode: data.ifscCode,
            bankAccountNumber: data.bankAccountNumber,
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
          bankName: data.bankName,
          ifscCode: data.ifscCode,
          bankAccountNumber: data.bankAccountNumber,
          familyId: data.familyId,
        })
        .returning();
      return farmer;
    });
  },

  async getFarmers() {
    return await db.query.farmers.findMany({
      with: farmerDetailRelations,
    });
  },

  async getFarmerById(id: string) {
    return await db.query.farmers.findFirst({
      where: eq(farmers.id, id),
      with: farmerDetailRelations,
    });
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

  // --- Farmer contracts ---
  async getFarmerContracts(farmerId: string) {
    const farmer = await db.query.farmers.findFirst({
      where: eq(farmers.id, farmerId),
    });
    if (!farmer) return undefined;

    return await db.query.farmerContracts.findMany({
      where: eq(farmerContracts.farmerId, farmerId),
    });
  },

  async getFarmerContract(farmerId: string, contractId: string) {
    const farmer = await db.query.farmers.findFirst({
      where: eq(farmers.id, farmerId),
    });
    if (!farmer) return { farmerFound: false as const };

    const contract = await db.query.farmerContracts.findFirst({
      where: and(eq(farmerContracts.id, contractId), eq(farmerContracts.farmerId, farmerId)),
    });
    if (!contract) return { farmerFound: true as const, contract: undefined };

    return { farmerFound: true as const, contract };
  },

  async createFarmerContract(farmerId: string, data: CreateFarmerContractBody) {
    const farmer = await db.query.farmers.findFirst({
      where: eq(farmers.id, farmerId),
    });
    if (!farmer) return undefined;

    const [contract] = await db
      .insert(farmerContracts)
      .values({
        farmerId,
        variety: data.variety,
        date: data.date,
        acres: data.acres,
        ...(data.contractUrl !== undefined ? { contractUrl: data.contractUrl } : {}),
        ...(data.hindiContractUrl !== undefined ? { hindiContractUrl: data.hindiContractUrl } : {}),
      })
      .returning();
    return contract;
  },

  async updateFarmerContract(farmerId: string, contractId: string, data: UpdateFarmerContractBody) {
    const [updated] = await db
      .update(farmerContracts)
      .set({
        ...(data.variety !== undefined ? { variety: data.variety } : {}),
        ...(data.date !== undefined ? { date: data.date } : {}),
        ...(data.acres !== undefined ? { acres: data.acres } : {}),
        ...(data.contractUrl !== undefined ? { contractUrl: data.contractUrl } : {}),
        ...(data.hindiContractUrl !== undefined ? { hindiContractUrl: data.hindiContractUrl } : {}),
        ...(data.isNotarized !== undefined ? { isNotarized: data.isNotarized } : {}),
      })
      .where(and(eq(farmerContracts.id, contractId), eq(farmerContracts.farmerId, farmerId)))
      .returning();
    return updated;
  },

  async deleteFarmerContract(farmerId: string, contractId: string) {
    const [deleted] = await db
      .delete(farmerContracts)
      .where(and(eq(farmerContracts.id, contractId), eq(farmerContracts.farmerId, farmerId)))
      .returning();
    return deleted;
  },
};
