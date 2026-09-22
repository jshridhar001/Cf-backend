import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/index.js";
import { user } from "@/db/schema/access-control.js";
import { farmers } from "@/db/schema/farmers.js";
import {
  areas,
  districts,
  policeStations,
  postOffices,
  states,
  varieties,
  villages,
} from "@/db/schema/masters.js";
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

const requisitionDetailSelect = {
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
  approvedDeliveryDate: seedRequisitions.approvedDeliveryDate,
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
  areaId: areas.id,
  areaName: areas.name,
  villageId: villages.id,
  villageName: villages.name,
  policeStationId: policeStations.id,
  policeStationName: policeStations.name,
  postOfficeId: postOffices.id,
  postOfficeName: postOffices.name,
  pincode: postOffices.pincode,
  districtId: districts.id,
  districtName: districts.name,
  stateId: states.id,
  stateName: states.name,
  varietyName: varieties.name,
  createdByName: createdByUser.name,
  approvedByName: approvedByUser.name,
  rejectedByName: rejectedByUser.name,
};

type RequisitionDetailRow = {
  id: string;
  farmerId: string;
  varietyId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBags: number | null;
  requestedAcres: string | null;
  fulfilledBags: number;
  fulfilledAcres: string;
  requisitionDate: Date;
  requestedDeliveryDate: Date;
  approvedDeliveryDate: Date | null;
  remarks: string | null;
  rejectionRemarks: string | null;
  createdById: string;
  approvedById: string | null;
  rejectedById: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  farmerName: string;
  farmerAccountNumber: string;
  farmerMobileNumber: string;
  areaId: string;
  areaName: string;
  villageId: string;
  villageName: string;
  policeStationId: string;
  policeStationName: string;
  postOfficeId: string;
  postOfficeName: string;
  pincode: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  varietyName: string;
  createdByName: string | null;
  approvedByName: string | null;
  rejectedByName: string | null;
};

function requisitionDetailQuery() {
  return db
    .select(requisitionDetailSelect)
    .from(seedRequisitions)
    .innerJoin(farmers, eq(seedRequisitions.farmerId, farmers.id))
    .innerJoin(areas, eq(farmers.areaId, areas.id))
    .innerJoin(villages, eq(areas.villageId, villages.id))
    .innerJoin(policeStations, eq(villages.policeStationId, policeStations.id))
    .innerJoin(postOffices, eq(policeStations.postOfficeId, postOffices.id))
    .innerJoin(districts, eq(postOffices.districtId, districts.id))
    .innerJoin(states, eq(districts.stateId, states.id))
    .innerJoin(varieties, eq(seedRequisitions.varietyId, varieties.id))
    .leftJoin(createdByUser, eq(seedRequisitions.createdById, createdByUser.id))
    .leftJoin(approvedByUser, eq(seedRequisitions.approvedById, approvedByUser.id))
    .leftJoin(rejectedByUser, eq(seedRequisitions.rejectedById, rejectedByUser.id));
}

function mapRequisitionDetailRow(row: RequisitionDetailRow) {
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
    approvedDeliveryDate: row.approvedDeliveryDate,
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
      area: {
        id: row.areaId,
        name: row.areaName,
        village: { id: row.villageId, name: row.villageName },
        policeStation: { id: row.policeStationId, name: row.policeStationName },
        postOffice: { id: row.postOfficeId, name: row.postOfficeName, pincode: row.pincode },
        district: { id: row.districtId, name: row.districtName },
        state: { id: row.stateId, name: row.stateName },
      },
    },
    variety: { name: row.varietyName },
    createdBy: row.createdByName ? { name: row.createdByName } : null,
    approvedBy: row.approvedByName ? { name: row.approvedByName } : null,
    rejectedBy: row.rejectedByName ? { name: row.rejectedByName } : null,
    dispatchStops: [] as unknown[],
  };
}

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
      approvedDeliveryDate: data.approvedDeliveryDate ? new Date(data.approvedDeliveryDate) : null,
      remarks: data.remarks,
      createdById: userId,
    })
    .returning();
  return newReq;
}

export async function getAllSeedRequisitions(query: ListSeedRequisitionsQuery) {
  const { status, farmerId, varietyId, requisitionDateFrom, requisitionDateTo } = query;

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

  return db.query.seedRequisitions.findMany({
    where,
    orderBy: [desc(seedRequisitions.createdAt)],
    with: {
      farmer: {
        columns: { name: true, accountNumber: true },
        with: {
          area: {
            columns: { id: true, name: true },
            with: {
              village: {
                columns: { id: true, name: true },
                with: {
                  policeStation: {
                    columns: { id: true, name: true },
                    with: {
                      postOffice: {
                        columns: { id: true, name: true, pincode: true },
                        with: {
                          district: {
                            columns: { id: true, name: true },
                            with: {
                              state: { columns: { id: true, name: true } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      variety: { columns: { name: true } },
    },
  });
}

export async function getSeedRequisitionById(id: string) {
  const [row] = await requisitionDetailQuery().where(eq(seedRequisitions.id, id)).limit(1);
  if (!row) return null;
  return mapRequisitionDetailRow(row);
}

export async function updateSeedRequisition(id: string, data: UpdateSeedRequisitionBody) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.requisitionDate) updateData.requisitionDate = new Date(data.requisitionDate);
  if (data.requestedDeliveryDate)
    updateData.requestedDeliveryDate = new Date(data.requestedDeliveryDate);
  if (data.approvedDeliveryDate)
    updateData.approvedDeliveryDate = new Date(data.approvedDeliveryDate);

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
    approvedDeliveryDate?: Date;
    rejectionRemarks?: string;
    rejectedById?: string;
    rejectedAt?: Date;
  } = { status: data.status };

  if (data.status === "APPROVED") {
    updatePayload.approvedById = userId;
    updatePayload.approvedAt = new Date();
    if (data.approvedDeliveryDate) {
      updatePayload.approvedDeliveryDate = new Date(data.approvedDeliveryDate);
    }
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
