import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { facilities, seedSizes } from "@/db/schema/masters.js";
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
  round2,
  sumAcresFromBagLines,
} from "@/features/seed-dispatch/quantity.js";
import type { CreateDispatchInput } from "@/features/seed-dispatch/seed-dispatch.schema.js";
import { debitFarmerStockFromLot } from "@/features/seed-dispatch/stock-balance.js";

export const seedDispatchService = {
  // 1. CREATE DISPATCH (Atomic Transaction)
  async createDispatch(payload: CreateDispatchInput, userId: string) {
    return await db.transaction(async (tx) => {
      const requisitionIds = payload.requisitions.map((stop) => stop.requisitionId);
      const sizeIds = [
        ...new Set(payload.requisitions.flatMap((stop) => stop.lines.map((line) => line.sizeId))),
      ];
      const facilityIds = [
        ...new Set(
          payload.requisitions.flatMap((stop) => stop.lines.map((line) => line.facilityId)),
        ),
      ];

      const requisitionRows = await tx
        .select()
        .from(seedRequisitions)
        .where(inArray(seedRequisitions.id, requisitionIds))
        .for("update");

      if (requisitionRows.length !== requisitionIds.length) {
        throw new Error("One or more requisitions were not found.");
      }

      const sizeRows =
        sizeIds.length > 0
          ? await tx.select().from(seedSizes).where(inArray(seedSizes.id, sizeIds))
          : [];

      if (sizeRows.length !== sizeIds.length) {
        throw new Error("One or more seed sizes were not found.");
      }

      const sizeById = new Map(sizeRows.map((row) => [row.id, row]));
      const requisitionById = new Map(requisitionRows.map((row) => [row.id, row]));
      const facilityBagTotals = new Map<string, number>();

      for (const reqStop of payload.requisitions) {
        const requisition = requisitionById.get(reqStop.requisitionId);
        if (!requisition) {
          throw new Error("One or more requisitions were not found.");
        }
        if (requisition.status !== "APPROVED") {
          throw new Error("Only approved requisitions can be dispatched.");
        }

        const quantityRow = {
          acres: requisition.requestedAcres != null ? String(requisition.requestedAcres) : null,
          seedBagsInitialQuantity:
            requisition.requestedBags != null ? String(requisition.requestedBags) : null,
          fulfilledQuantity: String(requisition.fulfilledBags ?? 0),
          fulfilledAcres: String(requisition.fulfilledAcres ?? 0),
        };

        const bagTotal = reqStop.lines.reduce((sum, line) => sum + line.bagQuantity, 0);

        if (isAcresBasedRequisition(quantityRow)) {
          const remainingAcres = getRemainingAcres(quantityRow);
          const bagLines = reqStop.lines.map((line) => {
            const size = sizeById.get(line.sizeId);
            const bagsPerAcre = size?.seedBagsPerAcre ?? 0;
            return { quantity: line.bagQuantity, bagsPerAcre };
          });
          assertAcresLinesWithinMaxBags(bagLines, remainingAcres);
        } else {
          const remainingBags = getRemainingBags(quantityRow);
          if (bagTotal > remainingBags) {
            throw new Error(
              "Dispatch quantity exceeds remaining seed bags for a selected requisition.",
            );
          }
        }

        for (const line of reqStop.lines) {
          facilityBagTotals.set(
            line.facilityId,
            (facilityBagTotals.get(line.facilityId) ?? 0) + line.bagQuantity,
          );
        }
      }

      if (facilityIds.length > 0) {
        const facilityRows = await tx
          .select({ id: facilities.id })
          .from(facilities)
          .where(inArray(facilities.id, facilityIds));
        if (facilityRows.length !== facilityIds.length) {
          throw new Error("One or more facilities were not found.");
        }
      }

      const [newDispatch] = await tx
        .insert(dispatches)
        .values({
          toLocation: payload.toLocation,
          status: "IN_TRANSIT",
          dispatchDate: new Date(),
          truckNumber: payload.truckNumber,
          driverMobile: payload.driverMobile,
          manualGatePassNumber: payload.manualGatePassNumber,
          weightSlipNumber: payload.weightSlipNumber,
          grossWeight: payload.grossWeight?.toString(),
          tareWeight: payload.tareWeight?.toString(),
          netWeight: payload.netWeight?.toString(),
          remarks: payload.remarks,
          createdById: userId,
        })
        .returning();

      for (const reqStop of payload.requisitions) {
        const requisition = requisitionById.get(reqStop.requisitionId)!;
        const bagTotal = reqStop.lines.reduce((sum, line) => sum + line.bagQuantity, 0);

        const [newReqStop] = await tx
          .insert(dispatchRequisitions)
          .values({
            dispatchId: newDispatch.id,
            requisitionId: reqStop.requisitionId,
            status: "PENDING",
          })
          .returning();

        await tx.insert(dispatchRequisitionSizeLines).values(
          reqStop.lines.map((line) => ({
            dispatchRequisitionId: newReqStop.id,
            facilityId: line.facilityId,
            sizeId: line.sizeId,
            generationId: line.generationId,
            bagQuantity: line.bagQuantity,
          })),
        );

        const quantityRow = {
          acres: requisition.requestedAcres != null ? String(requisition.requestedAcres) : null,
          seedBagsInitialQuantity:
            requisition.requestedBags != null ? String(requisition.requestedBags) : null,
          fulfilledQuantity: String(requisition.fulfilledBags ?? 0),
          fulfilledAcres: String(requisition.fulfilledAcres ?? 0),
        };

        const nextFulfilledBags = (requisition.fulfilledBags ?? 0) + bagTotal;

        if (isAcresBasedRequisition(quantityRow)) {
          const consumedAcres = sumAcresFromBagLines(
            reqStop.lines.map((line) => ({
              quantity: line.bagQuantity,
              bagsPerAcre: sizeById.get(line.sizeId)!.seedBagsPerAcre!,
            })),
          );
          // May slightly exceed requested acres when bags half-up; remaining floors at 0.
          const nextFulfilledAcres = round2(
            parseDecimal(requisition.fulfilledAcres) + consumedAcres,
          );

          await tx
            .update(seedRequisitions)
            .set({
              fulfilledBags: nextFulfilledBags,
              fulfilledAcres: formatDecimal(nextFulfilledAcres),
            })
            .where(eq(seedRequisitions.id, reqStop.requisitionId));
        } else {
          await tx
            .update(seedRequisitions)
            .set({ fulfilledBags: nextFulfilledBags })
            .where(eq(seedRequisitions.id, reqStop.requisitionId));
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

      return newDispatch;
    });
  },

  // 2. READ DISPATCHES
  async getAllDispatches() {
    return await db.query.dispatches.findMany({
      orderBy: (dispatch, { desc }) => [desc(dispatch.createdAt)],
      with: {
        dispatchRequisitions: {
          with: {
            sizeLines: true,
          },
        },
      },
    });
  },

  async getDispatchById(dispatchId: string) {
    const dispatch = await db.query.dispatches.findFirst({
      where: eq(dispatches.id, dispatchId),
      with: {
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
      },
    });

    if (!dispatch) throw new Error("Dispatch not found");
    return dispatch;
  },

  // 3. MARK AS NULL (Reverse operation)
  async markDispatchAsNull(dispatchId: string) {
    return await db.transaction(async (tx) => {
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

      if (!dispatch) throw new Error("Dispatch not found");
      if (dispatch.status === "NULL") throw new Error("Dispatch is already nullified");

      const [updatedDispatch] = await tx
        .update(dispatches)
        .set({ status: "NULL", updatedAt: new Date() })
        .where(eq(dispatches.id, dispatchId))
        .returning();

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
          await debitFarmerStockFromLot(tx, {
            dispatchRequisitionId: stop.id,
            farmerId: requisition.farmerId,
            varietyId: requisition.varietyId,
          });
        }

        const bagTotal = stop.sizeLines.reduce((sum, line) => sum + line.bagQuantity, 0);
        const nextFulfilledBags = Math.max(0, (requisition.fulfilledBags ?? 0) - bagTotal);

        const quantityRow = {
          acres: requisition.requestedAcres != null ? String(requisition.requestedAcres) : null,
          seedBagsInitialQuantity:
            requisition.requestedBags != null ? String(requisition.requestedBags) : null,
          fulfilledQuantity: String(requisition.fulfilledBags ?? 0),
          fulfilledAcres: String(requisition.fulfilledAcres ?? 0),
        };

        if (isAcresBasedRequisition(quantityRow)) {
          const consumedAcres = sumAcresFromBagLines(
            stop.sizeLines.map((line) => ({
              quantity: line.bagQuantity,
              bagsPerAcre: sizeById.get(line.sizeId)?.seedBagsPerAcre ?? 0,
            })),
          );
          const nextFulfilledAcres = Math.max(
            0,
            round2(parseDecimal(requisition.fulfilledAcres) - consumedAcres),
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

      return updatedDispatch;
    });
  },

  // 4. UPDATE STATUS
  async updateStatus(dispatchId: string, status: "IN_TRANSIT" | "DELIVERED", remarks?: string) {
    const [updated] = await db
      .update(dispatches)
      .set({
        status,
        remarks: remarks || null,
        updatedAt: new Date(),
      })
      .where(eq(dispatches.id, dispatchId))
      .returning();

    return updated;
  },
};
