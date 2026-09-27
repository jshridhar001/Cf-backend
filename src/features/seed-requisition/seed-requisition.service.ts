import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";
import type {
  CreateSeedRequisitionBody,
  DecideSeedRequisitionBody,
} from "@/features/seed-requisition/seed-requisition.schema.js";

const seedRequisitionWith = {
  farmer: {
    with: {
      state: true,
      district: true,
      station: true,
      policeStation: true,
      pincode: true,
      postOffice: true,
      village: true,
    },
  },
  variety: true,
} as const;

export const seedRequisitionsService = {
  async getAllSeedRequisitions() {
    return await db.query.seedRequisitions.findMany({
      orderBy: [desc(seedRequisitions.createdAt)],
      with: seedRequisitionWith,
    });
  },

  async getSeedRequisitionById(id: string) {
    return await db.query.seedRequisitions.findFirst({
      where: eq(seedRequisitions.id, id),
      with: seedRequisitionWith,
    });
  },

  async createSeedRequisition(data: CreateSeedRequisitionBody, createdById: string) {
    const [created] = await db
      .insert(seedRequisitions)
      .values({
        farmerId: data.farmerId,
        varietyId: data.varietyId,
        requestedBags: data.requestedBags,
        requestedAcres: data.requestedAcres,
        contractDate: data.contractDate,
        requisitionDate: data.requisitionDate,
        requestedDeliveryDate: data.requestedDeliveryDate,
        remarks: data.remarks,
        createdById,
      })
      .returning({ id: seedRequisitions.id });

    return await db.query.seedRequisitions.findFirst({
      where: eq(seedRequisitions.id, created.id),
      with: seedRequisitionWith,
    });
  },

  async decideSeedRequisition(id: string, body: DecideSeedRequisitionBody, decidedById: string) {
    const now = new Date();
    const [updated] = await db
      .update(seedRequisitions)
      .set(
        body.decision === "APPROVED"
          ? {
              status: "APPROVED",
              approvedDeliveryDate: body.approvedDeliveryDate,
              approvedById: decidedById,
              approvedAt: now,
            }
          : {
              status: "REJECTED",
              rejectionRemarks: body.rejectionRemarks,
              rejectedById: decidedById,
              rejectedAt: now,
            },
      )
      .where(and(eq(seedRequisitions.id, id), eq(seedRequisitions.status, "PENDING")))
      .returning({ id: seedRequisitions.id });

    if (!updated) {
      const existing = await db.query.seedRequisitions.findFirst({
        where: eq(seedRequisitions.id, id),
        columns: { id: true },
      });

      if (!existing) {
        return { error: "not_found" as const };
      }

      return { error: "not_pending" as const };
    }

    const data = await db.query.seedRequisitions.findFirst({
      where: eq(seedRequisitions.id, updated.id),
      with: seedRequisitionWith,
    });

    return { error: null, data };
  },
};
