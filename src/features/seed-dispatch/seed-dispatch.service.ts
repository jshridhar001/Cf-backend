import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { facilities, generations, seedSizes } from "@/db/schema/masters.js";
import {
  dispatches,
  dispatchRequisitionSizeLines,
  dispatchRequisitions,
} from "@/db/schema/seed-dispatch.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";
import {
  assertAcresLinesWithinMaxBags,
  formatDecimal,
  getRemainingAcres,
  getRemainingBags,
  isAcresBasedRequisition,
  parseDecimal,
  roundDecimal,
  sumAcresFromBagLines,
} from "@/features/seed-dispatch/quantity.js";
import type {
  CreateDispatchBody,
  UpdateDispatchStatusBody,
} from "@/features/seed-dispatch/seed-dispatch.schema.js";
import { debitFarmerStockFromLot } from "@/features/seed-dispatch/stock-balance.js";

const dispatchWith = {
  dispatchRequisitions: {
    with: {
      requisition: {
        with: {
          farmer: true,
          variety: true,
        },
      },
      sizeLines: {
        with: {
          facility: true,
          size: true,
          generation: true,
        },
      },
    },
  },
} as const;

type DispatchErrorCode =
  | "invalid_requisition"
  | "not_approved"
  | "quantity_exceeded"
  | "invalid_size"
  | "invalid_reference"
  | "not_found"
  | "already_null"
  | "invalid_transition"
  | "stock_debit_failed";

class DispatchFlowError extends Error {
  constructor(
    readonly code: DispatchErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DispatchFlowError";
  }
}

function quantityRow(requisition: {
  requestedAcres: string | null;
  requestedBags: number | null;
  fulfilledBags: number | null;
  fulfilledAcres: string | null;
}) {
  return {
    acres: requisition.requestedAcres,
    seedBagsInitialQuantity:
      requisition.requestedBags != null ? String(requisition.requestedBags) : null,
    fulfilledQuantity: String(requisition.fulfilledBags ?? 0),
    fulfilledAcres: String(requisition.fulfilledAcres ?? 0),
  };
}

function asQuantityError(error: unknown): DispatchFlowError | null {
  if (!(error instanceof Error)) return null;
  if (error.message.includes("bags-per-acre")) {
    return new DispatchFlowError("invalid_size", error.message);
  }
  if (error.message.includes("exceeds remaining")) {
    return new DispatchFlowError("quantity_exceeded", error.message);
  }
  return null;
}

async function loadDispatch(id: string) {
  return await db.query.dispatches.findFirst({
    where: eq(dispatches.id, id),
    with: dispatchWith,
  });
}

async function runDispatchFlow<T>(work: () => Promise<T>) {
  try {
    const data = await work();
    return { error: null, data } as const;
  } catch (error) {
    if (error instanceof DispatchFlowError) {
      return { error: error.code, message: error.message } as const;
    }
    throw error;
  }
}

export const seedDispatchesService = {
  async getAllDispatches() {
    return await db.query.dispatches.findMany({
      orderBy: [desc(dispatches.createdAt)],
      with: dispatchWith,
    });
  },

  async getDispatchById(id: string) {
    return await loadDispatch(id);
  },

  async createDispatch(data: CreateDispatchBody, createdById: string) {
    return await runDispatchFlow(async () => {
      const createdId = await db.transaction(async (tx) => {
        const requisitionIds = data.requisitions.map((stop) => stop.requisitionId);
        const sizeIds = [
          ...new Set(
            data.requisitions.flatMap((stop) => stop.sizeLines.map((line) => line.sizeId)),
          ),
        ];
        const facilityIds = [
          ...new Set(
            data.requisitions.flatMap((stop) => stop.sizeLines.map((line) => line.facilityId)),
          ),
        ];
        const generationIds = [
          ...new Set(
            data.requisitions.flatMap((stop) => stop.sizeLines.map((line) => line.generationId)),
          ),
        ];

        const requisitionRows = await tx
          .select()
          .from(seedRequisitions)
          .where(inArray(seedRequisitions.id, requisitionIds))
          .for("update");

        if (requisitionRows.length !== requisitionIds.length) {
          throw new DispatchFlowError("invalid_requisition", "Invalid seed requisition");
        }

        if (requisitionRows.some((requisition) => requisition.status !== "APPROVED")) {
          throw new DispatchFlowError(
            "not_approved",
            "Only approved seed requisitions can be dispatched",
          );
        }

        const sizeRows =
          sizeIds.length > 0
            ? await tx.select().from(seedSizes).where(inArray(seedSizes.id, sizeIds))
            : [];
        if (sizeRows.length !== sizeIds.length) {
          throw new DispatchFlowError(
            "invalid_reference",
            "Invalid facility, seed size, or generation",
          );
        }

        const facilityRows =
          facilityIds.length > 0
            ? await tx
                .select({ id: facilities.id })
                .from(facilities)
                .where(inArray(facilities.id, facilityIds))
            : [];
        if (facilityRows.length !== facilityIds.length) {
          throw new DispatchFlowError(
            "invalid_reference",
            "Invalid facility, seed size, or generation",
          );
        }

        const generationRows =
          generationIds.length > 0
            ? await tx
                .select({ id: generations.id })
                .from(generations)
                .where(inArray(generations.id, generationIds))
            : [];
        if (generationRows.length !== generationIds.length) {
          throw new DispatchFlowError(
            "invalid_reference",
            "Invalid facility, seed size, or generation",
          );
        }

        const sizeById = new Map(sizeRows.map((row) => [row.id, row]));
        const requisitionById = new Map(requisitionRows.map((row) => [row.id, row]));
        const facilityBagTotals = new Map<string, number>();

        for (const stop of data.requisitions) {
          const requisition = requisitionById.get(stop.requisitionId);
          if (!requisition) {
            throw new DispatchFlowError("invalid_requisition", "Invalid seed requisition");
          }

          const row = quantityRow(requisition);
          const bagTotal = stop.sizeLines.reduce((sum, line) => sum + line.bagQuantity, 0);

          if (isAcresBasedRequisition(row)) {
            try {
              assertAcresLinesWithinMaxBags(
                stop.sizeLines.map((line) => ({
                  quantity: line.bagQuantity,
                  bagsPerAcre: sizeById.get(line.sizeId)?.seedBagsPerAcre ?? 0,
                })),
                getRemainingAcres(row),
              );
            } catch (error) {
              const mapped = asQuantityError(error);
              if (mapped) throw mapped;
              throw error;
            }
          } else if (bagTotal > getRemainingBags(row)) {
            throw new DispatchFlowError(
              "quantity_exceeded",
              "Dispatch quantity exceeds remaining seed bags for a selected requisition.",
            );
          }

          for (const line of stop.sizeLines) {
            facilityBagTotals.set(
              line.facilityId,
              (facilityBagTotals.get(line.facilityId) ?? 0) + line.bagQuantity,
            );
          }
        }

        const [created] = await tx
          .insert(dispatches)
          .values({
            toLocation: data.toLocation,
            truckNumber: data.truckNumber,
            status: "IN_TRANSIT",
            dispatchDate: data.dispatchDate ?? new Date(),
            driverMobile: data.driverMobile,
            manualGatePassNumber: data.manualGatePassNumber,
            weightSlipNumber: data.weightSlipNumber,
            grossWeight: data.grossWeight,
            tareWeight: data.tareWeight,
            netWeight: data.netWeight,
            remarks: data.remarks,
            createdById,
          })
          .returning({ id: dispatches.id });

        for (const stop of data.requisitions) {
          const requisition = requisitionById.get(stop.requisitionId);
          if (!requisition) {
            throw new DispatchFlowError("invalid_requisition", "Invalid seed requisition");
          }

          const bagTotal = stop.sizeLines.reduce((sum, line) => sum + line.bagQuantity, 0);
          const [insertedStop] = await tx
            .insert(dispatchRequisitions)
            .values({
              dispatchId: created.id,
              requisitionId: stop.requisitionId,
              status: "PENDING",
            })
            .returning({ id: dispatchRequisitions.id });

          await tx.insert(dispatchRequisitionSizeLines).values(
            stop.sizeLines.map((line) => ({
              dispatchRequisitionId: insertedStop.id,
              facilityId: line.facilityId,
              sizeId: line.sizeId,
              generationId: line.generationId,
              bagQuantity: line.bagQuantity,
            })),
          );

          const row = quantityRow(requisition);
          const nextFulfilledBags = (requisition.fulfilledBags ?? 0) + bagTotal;

          if (isAcresBasedRequisition(row)) {
            const consumedAcres = sumAcresFromBagLines(
              stop.sizeLines.map((line) => ({
                quantity: line.bagQuantity,
                bagsPerAcre: sizeById.get(line.sizeId)?.seedBagsPerAcre ?? 0,
              })),
            );
            const nextFulfilledAcres = roundDecimal(
              parseDecimal(requisition.fulfilledAcres) + consumedAcres,
            );

            await tx
              .update(seedRequisitions)
              .set({
                fulfilledBags: nextFulfilledBags,
                fulfilledAcres: formatDecimal(nextFulfilledAcres),
              })
              .where(eq(seedRequisitions.id, stop.requisitionId));
          } else {
            await tx
              .update(seedRequisitions)
              .set({ fulfilledBags: nextFulfilledBags })
              .where(eq(seedRequisitions.id, stop.requisitionId));
          }
        }

        for (const [facilityId, bags] of facilityBagTotals) {
          await tx
            .update(facilities)
            .set({
              totalBagsDispatched: sql`${facilities.totalBagsDispatched} + ${bags}`,
            })
            .where(eq(facilities.id, facilityId));
        }

        return created.id;
      });

      const created = await loadDispatch(createdId);
      if (!created) {
        throw new DispatchFlowError("not_found", "Seed dispatch not found");
      }
      return created;
    });
  },

  async markDispatchAsNull(dispatchId: string) {
    return await runDispatchFlow(async () => {
      await db.transaction(async (tx) => {
        const dispatch = await tx.query.dispatches.findFirst({
          where: eq(dispatches.id, dispatchId),
          with: {
            dispatchRequisitions: {
              with: {
                sizeLines: true,
                requisition: true,
              },
            },
          },
        });

        if (!dispatch) {
          throw new DispatchFlowError("not_found", "Seed dispatch not found");
        }
        if (dispatch.status === "NULL") {
          throw new DispatchFlowError("already_null", "Dispatch is already nullified");
        }

        await tx
          .update(dispatches)
          .set({ status: "NULL", updatedAt: new Date() })
          .where(eq(dispatches.id, dispatchId));

        const sizeIds = [
          ...new Set(
            dispatch.dispatchRequisitions.flatMap((stop) =>
              stop.sizeLines.map((line) => line.sizeId),
            ),
          ),
        ];
        const sizeRows =
          sizeIds.length > 0
            ? await tx.select().from(seedSizes).where(inArray(seedSizes.id, sizeIds))
            : [];
        const sizeById = new Map(sizeRows.map((row) => [row.id, row]));

        for (const stop of dispatch.dispatchRequisitions) {
          const requisition = stop.requisition;
          if (!requisition) continue;

          if (stop.status === "RECEIVED") {
            try {
              await debitFarmerStockFromLot(tx, {
                dispatchRequisitionId: stop.id,
                farmerId: requisition.farmerId,
                varietyId: requisition.varietyId,
              });
            } catch (error) {
              if (error instanceof Error && error.message.includes("Stock debit")) {
                throw new DispatchFlowError("stock_debit_failed", error.message);
              }
              throw error;
            }
          }

          const bagTotal = stop.sizeLines.reduce((sum, line) => sum + line.bagQuantity, 0);
          const nextFulfilledBags = Math.max(0, (requisition.fulfilledBags ?? 0) - bagTotal);
          const row = quantityRow(requisition);

          if (isAcresBasedRequisition(row)) {
            const consumedAcres = sumAcresFromBagLines(
              stop.sizeLines.map((line) => ({
                quantity: line.bagQuantity,
                bagsPerAcre: sizeById.get(line.sizeId)?.seedBagsPerAcre ?? 0,
              })),
            );
            const nextFulfilledAcres = Math.max(
              0,
              roundDecimal(parseDecimal(requisition.fulfilledAcres) - consumedAcres),
            );

            await tx
              .update(seedRequisitions)
              .set({
                fulfilledBags: nextFulfilledBags,
                fulfilledAcres: formatDecimal(nextFulfilledAcres),
              })
              .where(eq(seedRequisitions.id, requisition.id));
          } else {
            await tx
              .update(seedRequisitions)
              .set({ fulfilledBags: nextFulfilledBags })
              .where(eq(seedRequisitions.id, requisition.id));
          }

          for (const line of stop.sizeLines) {
            await tx
              .update(facilities)
              .set({
                totalBagsDispatched: sql`greatest(0, ${facilities.totalBagsDispatched} - ${line.bagQuantity})`,
              })
              .where(eq(facilities.id, line.facilityId));
          }
        }
      });

      const updated = await loadDispatch(dispatchId);
      if (!updated) {
        throw new DispatchFlowError("not_found", "Seed dispatch not found");
      }
      return updated;
    });
  },

  async updateStatus(dispatchId: string, payload: UpdateDispatchStatusBody) {
    return await runDispatchFlow(async () => {
      const existing = await loadDispatch(dispatchId);
      if (!existing) {
        throw new DispatchFlowError("not_found", "Seed dispatch not found");
      }
      if (existing.status !== "IN_TRANSIT") {
        throw new DispatchFlowError(
          "invalid_transition",
          "Only in-transit dispatches can change status",
        );
      }

      await db
        .update(dispatches)
        .set({
          status: payload.status,
          ...(payload.remarks !== undefined ? { remarks: payload.remarks } : {}),
          updatedAt: new Date(),
        })
        .where(eq(dispatches.id, dispatchId));

      const updated = await loadDispatch(dispatchId);
      if (!updated) {
        throw new DispatchFlowError("not_found", "Seed dispatch not found");
      }
      return updated;
    });
  },
};
