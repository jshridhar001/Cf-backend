import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";
import type {
  CreateSeedRequisitionBody,
  ReviewRequisitionBody,
  UpdateSeedRequisitionBody,
} from "@/features/seed-requisition/seed-requisition.schema.js";

export async function createSeedRequisition(data: CreateSeedRequisitionBody, userId: string) {
  const [newReq] = await db
    .insert(seedRequisitions)
    .values({
      farmerId: data.farmerId,
      varietyId: data.varietyId,
      requestedBags: data.requestedBags ?? null,
      requestedAcres: data.requestedAcres !== undefined ? String(data.requestedAcres) : null,
      requisitionDate: new Date(data.requisitionDate),
      requestedDeliveryDate: new Date(data.requestedDeliveryDate),
      remarks: data.remarks,
      createdById: userId,
    })
    .returning();
  return newReq;
}

export async function getAllSeedRequisitions() {
  return await db.query.seedRequisitions.findMany({
    orderBy: [desc(seedRequisitions.createdAt)],
    with: {
      farmer: { columns: { name: true, accountNumber: true } },
      variety: { columns: { name: true } },
    },
  });
}

export async function getSeedRequisitionById(id: string) {
  return await db.query.seedRequisitions.findFirst({
    where: eq(seedRequisitions.id, id),
    with: {
      farmer: true,
      variety: true,
      dispatchStops: true,
    },
  });
}

export async function updateSeedRequisition(id: string, data: UpdateSeedRequisitionBody) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.requisitionDate) updateData.requisitionDate = new Date(data.requisitionDate);
  if (data.requestedDeliveryDate)
    updateData.requestedDeliveryDate = new Date(data.requestedDeliveryDate);

  // Switching measure: set the provided one and clear the other
  if (data.requestedBags !== undefined) {
    updateData.requestedBags = data.requestedBags;
    updateData.requestedAcres = null;
  } else if (data.requestedAcres !== undefined) {
    updateData.requestedAcres = String(data.requestedAcres);
    updateData.requestedBags = null;
  }

  const [updatedReq] = await db
    .update(seedRequisitions)
    .set(updateData)
    .where(eq(seedRequisitions.id, id))
    .returning();
  return updatedReq;
}

export async function reviewSeedRequisition(
  id: string,
  data: ReviewRequisitionBody,
  userId: string,
) {
  const updatePayload: {
    status: ReviewRequisitionBody["status"];
    approvedDeliveryDate?: Date;
    approvedById?: string;
    approvedAt?: Date;
    rejectionRemarks?: string;
    rejectedById?: string;
    rejectedAt?: Date;
  } = { status: data.status };

  if (data.status === "APPROVED") {
    updatePayload.approvedDeliveryDate = new Date(data.approvedDeliveryDate);
    updatePayload.approvedById = userId;
    updatePayload.approvedAt = new Date();
  } else if (data.status === "REJECTED") {
    updatePayload.rejectionRemarks = data.rejectionRemarks;
    updatePayload.rejectedById = userId;
    updatePayload.rejectedAt = new Date();
  }

  const [reviewedReq] = await db
    .update(seedRequisitions)
    .set(updatePayload)
    .where(eq(seedRequisitions.id, id))
    .returning();

  return reviewedReq;
}

export async function deleteSeedRequisition(id: string) {
  const [deletedReq] = await db
    .delete(seedRequisitions)
    .where(eq(seedRequisitions.id, id))
    .returning();
  return deletedReq;
}

export async function deleteAllSeedRequisitions() {
  // Be careful with this in production!
  return await db.delete(seedRequisitions).returning();
}
