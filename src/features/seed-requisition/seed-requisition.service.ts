import { and, type asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { seedSizes } from "@/db/schema/masters.js";
import { dispatches, dispatchRequisitions } from "@/db/schema/seed-dispatch.js";
import { seedRequisitionDeliveries, seedRequisitions } from "@/db/schema/seed-requisition.js";
import type {
  CreateSeedRequisitionBody,
  DecideDeliveryBody,
  UpdateSeedRequisitionBody,
} from "@/features/seed-requisition/seed-requisition.schema.js";
import { isUniqueViolation } from "@/lib/postgres-errors.js";

export class ActiveDispatchError extends Error {
  constructor() {
    super("This requisition has an active dispatch and cannot be edited.");
    this.name = "ActiveDispatchError";
  }
}

export class InvalidExpectedSizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidExpectedSizeError";
  }
}

type RequestedDelivery = NonNullable<CreateSeedRequisitionBody["requestedDeliveries"]>[number];
type DeliveryStatus = "PENDING" | "APPROVED" | "REJECTED";

type StoredDelivery = {
  deliveryDate: Date;
  acres: string | null;
  bags: number | null;
  status: DeliveryStatus;
  approvedById: string | null;
  approvedAt: Date | null;
  rejectedById: string | null;
  rejectedAt: Date | null;
  rejectionRemarks: string | null;
};

function toDeliveryRows(requisitionId: string, deliveries: RequestedDelivery[]) {
  return deliveries.map((line) => ({
    requisitionId,
    deliveryDate: line.deliveryDate,
    acres: line.acres ?? null,
    bags: line.bags ?? null,
  }));
}

function calendarDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

function sameQuantity(existing: Pick<StoredDelivery, "acres" | "bags">, next: RequestedDelivery) {
  if (next.bags != null) {
    return existing.bags === next.bags && existing.acres == null;
  }
  if (next.acres != null) {
    return existing.bags == null && Number(existing.acres) === Number(next.acres);
  }
  return false;
}

function rollupStatus(statuses: DeliveryStatus[]): DeliveryStatus {
  if (statuses.length === 0 || statuses.includes("PENDING")) return "PENDING";
  if (statuses.includes("APPROVED")) return "APPROVED";
  return "REJECTED";
}

async function recomputeRequisitionStatus(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  requisitionId: string,
) {
  const lines = await tx
    .select({ status: seedRequisitionDeliveries.status })
    .from(seedRequisitionDeliveries)
    .where(eq(seedRequisitionDeliveries.requisitionId, requisitionId));

  await tx
    .update(seedRequisitions)
    .set({ status: rollupStatus(lines.map((line) => line.status)) })
    .where(eq(seedRequisitions.id, requisitionId));
}

async function assertExpectedSize(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  sizeId: string | null | undefined,
  varietyId: string,
) {
  if (!sizeId) return;

  const [size] = await tx
    .select({ id: seedSizes.id, varietyId: seedSizes.varietyId })
    .from(seedSizes)
    .where(eq(seedSizes.id, sizeId))
    .limit(1);

  if (!size) {
    throw new InvalidExpectedSizeError("Invalid seed size");
  }

  if (size.varietyId && size.varietyId !== varietyId) {
    throw new InvalidExpectedSizeError("Seed size does not belong to this variety.");
  }
}

const seedRequisitionWith = {
  farmer: {
    with: {
      family: true,
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
  expectedSize: true,
  deliveries: {
    orderBy: (
      deliveries: { deliveryDate: typeof seedRequisitionDeliveries.deliveryDate },
      operators: { asc: typeof asc },
    ) => [operators.asc(deliveries.deliveryDate)],
  },
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

  async updateContractUrl(id: string, field: "engContractUrl" | "hindiContractUrl", url: string) {
    const [updated] = await db
      .update(seedRequisitions)
      .set({ [field]: url })
      .where(eq(seedRequisitions.id, id))
      .returning({ id: seedRequisitions.id });

    if (!updated) {
      return undefined;
    }

    return await db.query.seedRequisitions.findFirst({
      where: eq(seedRequisitions.id, updated.id),
      with: seedRequisitionWith,
    });
  },

  async createSeedRequisition(data: CreateSeedRequisitionBody, createdById: string) {
    const createdId = await db.transaction(async (tx) => {
      await assertExpectedSize(tx, data.expectedSizeId, data.varietyId);

      const [created] = await tx
        .insert(seedRequisitions)
        .values({
          farmerId: data.farmerId,
          varietyId: data.varietyId,
          expectedSizeId: data.expectedSizeId ?? null,
          requestedBags: data.requestedBags ?? null,
          requestedAcres: data.requestedAcres ?? null,
          contractDate: data.contractDate,
          requisitionDate: data.requisitionDate,
          remarks: data.remarks,
          ...(data.engContractUrl !== undefined ? { engContractUrl: data.engContractUrl } : {}),
          ...(data.hindiContractUrl !== undefined
            ? { hindiContractUrl: data.hindiContractUrl }
            : {}),
          createdById,
        })
        .returning({ id: seedRequisitions.id });

      const deliveries = toDeliveryRows(created.id, data.requestedDeliveries ?? []);
      if (deliveries.length > 0) {
        await tx.insert(seedRequisitionDeliveries).values(deliveries);
      }

      return created.id;
    });

    return await db.query.seedRequisitions.findFirst({
      where: eq(seedRequisitions.id, createdId),
      with: seedRequisitionWith,
    });
  },

  async updateSeedRequisition(id: string, data: UpdateSeedRequisitionBody) {
    const updatedId = await db.transaction(async (tx) => {
      await assertExpectedSize(tx, data.expectedSizeId, data.varietyId);

      const [updated] = await tx
        .update(seedRequisitions)
        .set({
          farmerId: data.farmerId,
          varietyId: data.varietyId,
          expectedSizeId: data.expectedSizeId ?? null,
          requestedBags: data.requestedBags ?? null,
          requestedAcres: data.requestedAcres ?? null,
          contractDate: data.contractDate,
          requisitionDate: data.requisitionDate ?? null,
          remarks: data.remarks ?? null,
          ...(data.engContractUrl !== undefined ? { engContractUrl: data.engContractUrl } : {}),
          ...(data.hindiContractUrl !== undefined
            ? { hindiContractUrl: data.hindiContractUrl }
            : {}),
        })
        .where(eq(seedRequisitions.id, id))
        .returning({ id: seedRequisitions.id });

      if (!updated) {
        return undefined;
      }

      const linkedDispatches = await tx
        .select({ status: dispatches.status })
        .from(dispatchRequisitions)
        .innerJoin(dispatches, eq(dispatchRequisitions.dispatchId, dispatches.id))
        .where(eq(dispatchRequisitions.requisitionId, updated.id));

      if (linkedDispatches.some((row) => row.status !== "NULL")) {
        throw new ActiveDispatchError();
      }

      if (linkedDispatches.length > 0) {
        await tx
          .update(dispatchRequisitions)
          .set({ deliveryId: null })
          .where(eq(dispatchRequisitions.requisitionId, updated.id));
      }

      const existingLines = await tx
        .select({
          deliveryDate: seedRequisitionDeliveries.deliveryDate,
          acres: seedRequisitionDeliveries.acres,
          bags: seedRequisitionDeliveries.bags,
          status: seedRequisitionDeliveries.status,
          approvedById: seedRequisitionDeliveries.approvedById,
          approvedAt: seedRequisitionDeliveries.approvedAt,
          rejectedById: seedRequisitionDeliveries.rejectedById,
          rejectedAt: seedRequisitionDeliveries.rejectedAt,
          rejectionRemarks: seedRequisitionDeliveries.rejectionRemarks,
        })
        .from(seedRequisitionDeliveries)
        .where(eq(seedRequisitionDeliveries.requisitionId, updated.id));

      await tx
        .delete(seedRequisitionDeliveries)
        .where(eq(seedRequisitionDeliveries.requisitionId, updated.id));

      const deliveries = (data.requestedDeliveries ?? []).map((line) => {
        const preserved = existingLines.find(
          (existing) =>
            calendarDay(existing.deliveryDate) === calendarDay(line.deliveryDate) &&
            sameQuantity(existing, line),
        );
        return {
          requisitionId: updated.id,
          deliveryDate: line.deliveryDate,
          acres: line.acres ?? null,
          bags: line.bags ?? null,
          status: preserved?.status ?? "PENDING",
          approvedById: preserved?.approvedById ?? null,
          approvedAt: preserved?.approvedAt ?? null,
          rejectedById: preserved?.rejectedById ?? null,
          rejectedAt: preserved?.rejectedAt ?? null,
          rejectionRemarks: preserved?.rejectionRemarks ?? null,
        } satisfies StoredDelivery & { requisitionId: string };
      });
      if (deliveries.length > 0) {
        await tx.insert(seedRequisitionDeliveries).values(deliveries);
      }

      await recomputeRequisitionStatus(tx, updated.id);

      return updated.id;
    });

    if (!updatedId) {
      return undefined;
    }

    return await db.query.seedRequisitions.findFirst({
      where: eq(seedRequisitions.id, updatedId),
      with: seedRequisitionWith,
    });
  },

  async decideDelivery(
    requisitionId: string,
    deliveryId: string,
    body: DecideDeliveryBody,
    decidedById: string,
  ) {
    const now = new Date();

    try {
      const updatedId = await db.transaction(async (tx) => {
        const [line] = await tx
          .select({
            id: seedRequisitionDeliveries.id,
            status: seedRequisitionDeliveries.status,
          })
          .from(seedRequisitionDeliveries)
          .where(
            and(
              eq(seedRequisitionDeliveries.id, deliveryId),
              eq(seedRequisitionDeliveries.requisitionId, requisitionId),
            ),
          )
          .limit(1);

        if (!line) {
          return { error: "missing" as const };
        }

        if (line.status !== "PENDING") {
          return { error: "not_pending" as const };
        }

        await tx
          .update(seedRequisitionDeliveries)
          .set(
            body.decision === "APPROVED"
              ? {
                  status: "APPROVED" as const,
                  ...(body.deliveryDate ? { deliveryDate: body.deliveryDate } : {}),
                  approvedById: decidedById,
                  approvedAt: now,
                  rejectedById: null,
                  rejectedAt: null,
                  rejectionRemarks: null,
                }
              : {
                  status: "REJECTED",
                  rejectionRemarks: body.rejectionRemarks,
                  rejectedById: decidedById,
                  rejectedAt: now,
                  approvedById: null,
                  approvedAt: null,
                },
          )
          .where(eq(seedRequisitionDeliveries.id, line.id));

        await recomputeRequisitionStatus(tx, requisitionId);
        return { error: null };
      });

      if (updatedId.error) {
        const requisition = await db.query.seedRequisitions.findFirst({
          where: eq(seedRequisitions.id, requisitionId),
          columns: { id: true },
        });
        if (!requisition) return { error: "not_found" as const };
        if (updatedId.error === "not_pending") return { error: "not_pending" as const };
        return { error: "delivery_not_found" as const };
      }
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { error: "date_taken" as const };
      }
      throw error;
    }

    const data = await db.query.seedRequisitions.findFirst({
      where: eq(seedRequisitions.id, requisitionId),
      with: seedRequisitionWith,
    });

    return { error: null, data };
  },

  async deleteSeedRequisition(id: string) {
    const [deleted] = await db
      .delete(seedRequisitions)
      .where(eq(seedRequisitions.id, id))
      .returning({ id: seedRequisitions.id });

    return deleted;
  },

  async deleteAllSeedRequisitions() {
    return await db.delete(seedRequisitions).returning({ id: seedRequisitions.id });
  },
};
