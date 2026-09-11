import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/index.js";
import { user } from "@/db/schema/access-control.js";
import { farmers } from "@/db/schema/farmers.js";
import { localities, stations, varieties } from "@/db/schema/masters.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";
import type {
  CreateSeedRequisitionBody,
  ListSeedRequisitionsQuery,
  ReviewRequisitionBody,
  UpdateSeedRequisitionBody,
} from "@/features/seed-requisition/seed-requisition.schema.js";

const createdByUser = alias(user, "created_by_user");
const approvedByUser = alias(user, "approved_by_user");
const rejectedByUser = alias(user, "rejected_by_user");

export async function createSeedRequisition(data: CreateSeedRequisitionBody, userId: string) {
  const [newReq] = await db
    .insert(seedRequisitions)
    .values({
      farmerId: data.farmerId,
      varietyId: data.varietyId,
      requestedBags: data.requestedBags ?? null,
      requestedAcres: data.requestedAcres ?? null,
      requisitionDate: new Date(data.requisitionDate),
      requestedDeliveryDate: new Date(data.requestedDeliveryDate),
      remarks: data.remarks,
      createdById: userId,
    })
    .returning();
  return newReq;
}

export async function getAllSeedRequisitions(query: ListSeedRequisitionsQuery) {
  const { page, pageSize, status, farmerId, varietyId, requisitionDateFrom, requisitionDateTo } =
    query;

  const filters: SQL[] = [];
  if (status) filters.push(eq(seedRequisitions.status, status));
  if (farmerId) filters.push(eq(seedRequisitions.farmerId, farmerId));
  if (varietyId) filters.push(eq(seedRequisitions.varietyId, varietyId));
  if (requisitionDateFrom) {
    filters.push(gte(seedRequisitions.requisitionDate, new Date(requisitionDateFrom)));
  }
  if (requisitionDateTo) {
    filters.push(lte(seedRequisitions.requisitionDate, new Date(requisitionDateTo)));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countRows] = await Promise.all([
    db.query.seedRequisitions.findMany({
      where,
      orderBy: [desc(seedRequisitions.createdAt)],
      limit: pageSize,
      offset,
      with: {
        farmer: { columns: { name: true, accountNumber: true } },
        variety: { columns: { name: true } },
      },
    }),
    db.select({ total: count() }).from(seedRequisitions).where(where),
  ]);

  return {
    data,
    meta: {
      page,
      pageSize,
      total: Number(countRows[0]?.total ?? 0),
    },
  };
}

export async function getSeedRequisitionById(id: string) {
  const [row] = await db
    .select({
      id: seedRequisitions.id,
      farmerId: seedRequisitions.farmerId,
      varietyId: seedRequisitions.varietyId,
      status: seedRequisitions.status,
      requestedBags: seedRequisitions.requestedBags,
      requestedAcres: seedRequisitions.requestedAcres,
      fulfilledBags: seedRequisitions.fulfilledBags,
      fulfilledAcres: seedRequisitions.fulfilledAcres,
      requisitionDate: seedRequisitions.requisitionDate,
      requestedDeliveryDate: seedRequisitions.requestedDeliveryDate,
      remarks: seedRequisitions.remarks,
      rejectionRemarks: seedRequisitions.rejectionRemarks,
      createdById: seedRequisitions.createdById,
      approvedById: seedRequisitions.approvedById,
      rejectedById: seedRequisitions.rejectedById,
      approvedAt: seedRequisitions.approvedAt,
      rejectedAt: seedRequisitions.rejectedAt,
      createdAt: seedRequisitions.createdAt,
      updatedAt: seedRequisitions.updatedAt,
      farmerName: farmers.name,
      farmerAccountNumber: farmers.accountNumber,
      farmerMobileNumber: farmers.mobileNumber,
      stationName: stations.name,
      localityName: localities.name,
      varietyName: varieties.name,
      createdByName: createdByUser.name,
      approvedByName: approvedByUser.name,
      rejectedByName: rejectedByUser.name,
    })
    .from(seedRequisitions)
    .innerJoin(farmers, eq(seedRequisitions.farmerId, farmers.id))
    .innerJoin(stations, eq(farmers.stationId, stations.id))
    .innerJoin(localities, eq(farmers.localityId, localities.id))
    .innerJoin(varieties, eq(seedRequisitions.varietyId, varieties.id))
    .leftJoin(createdByUser, eq(seedRequisitions.createdById, createdByUser.id))
    .leftJoin(approvedByUser, eq(seedRequisitions.approvedById, approvedByUser.id))
    .leftJoin(rejectedByUser, eq(seedRequisitions.rejectedById, rejectedByUser.id))
    .where(eq(seedRequisitions.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    farmerId: row.farmerId,
    varietyId: row.varietyId,
    status: row.status,
    requestedBags: row.requestedBags,
    requestedAcres: row.requestedAcres,
    fulfilledBags: row.fulfilledBags,
    fulfilledAcres: row.fulfilledAcres,
    requisitionDate: row.requisitionDate,
    requestedDeliveryDate: row.requestedDeliveryDate,
    remarks: row.remarks,
    rejectionRemarks: row.rejectionRemarks,
    createdById: row.createdById,
    approvedById: row.approvedById,
    rejectedById: row.rejectedById,
    approvedAt: row.approvedAt,
    rejectedAt: row.rejectedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    farmer: {
      name: row.farmerName,
      accountNumber: row.farmerAccountNumber,
      mobileNumber: row.farmerMobileNumber,
      station: { name: row.stationName },
      locality: { name: row.localityName },
    },
    variety: { name: row.varietyName },
    createdBy: row.createdByName ? { name: row.createdByName } : null,
    approvedBy: row.approvedByName ? { name: row.approvedByName } : null,
    rejectedBy: row.rejectedByName ? { name: row.rejectedByName } : null,
    dispatchStops: [] as unknown[],
  };
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
    updateData.requestedAcres = data.requestedAcres;
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
    approvedById?: string;
    approvedAt?: Date;
    rejectionRemarks?: string;
    rejectedById?: string;
    rejectedAt?: Date;
  } = { status: data.status };

  if (data.status === "APPROVED") {
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
  await db.delete(seedRequisitions);
}
