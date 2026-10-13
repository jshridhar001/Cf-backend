import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmers } from "@/db/schema/farmer.js";
import { farmerStockBalances } from "@/db/schema/farmer-stock.js";
import { generations, seedSizes, varieties } from "@/db/schema/masters.js";
import { stockTransferLines, stockTransfers } from "@/db/schema/stock-transfer.js";
import {
  assertSufficientStock,
  incrementFarmerStock,
} from "@/features/seed-dispatch/stock-balance.js";
import type { CreateStockTransferBody } from "@/features/stock-transfer/stock-transfer.schema.js";

const transferWith = {
  fromFarmer: true,
  toFarmer: true,
  lines: {
    with: {
      variety: true,
      size: true,
      generation: true,
    },
  },
} as const;

type TransferErrorCode =
  | "not_found"
  | "invalid_farmer"
  | "invalid_reference"
  | "insufficient_stock"
  | "already_null"
  | "stock_debit_failed";

class TransferFlowError extends Error {
  constructor(
    readonly code: TransferErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TransferFlowError";
  }
}

type StockTx = Parameters<typeof incrementFarmerStock>[0];

type TransferLine = {
  varietyId: string;
  sizeId: string;
  generationId: string;
  bagQuantity: number;
};

function rethrowStock(error: unknown, code: "insufficient_stock" | "stock_debit_failed"): never {
  if (error instanceof TransferFlowError) {
    throw error;
  }
  if (
    error instanceof Error &&
    (error.message.includes("Transfer quantity exceeds") ||
      error.message.includes("Stock debit exceeds") ||
      error.message.includes("Stock quantity must be positive"))
  ) {
    throw new TransferFlowError(code, error.message);
  }
  throw error;
}

async function loadTransfer(id: string) {
  return await db.query.stockTransfers.findFirst({
    where: eq(stockTransfers.id, id),
    with: transferWith,
  });
}

async function runTransferFlow<T>(work: () => Promise<T>) {
  try {
    const data = await work();
    return { error: null, data } as const;
  } catch (error) {
    if (error instanceof TransferFlowError) {
      return { error: error.code, message: error.message } as const;
    }
    throw error;
  }
}

async function lockFarmerBalances(tx: StockTx, farmerId: string) {
  return await tx
    .select({
      varietyId: farmerStockBalances.varietyId,
      sizeId: farmerStockBalances.sizeId,
      generationId: farmerStockBalances.generationId,
      balance: farmerStockBalances.balance,
    })
    .from(farmerStockBalances)
    .where(eq(farmerStockBalances.farmerId, farmerId))
    .for("update");
}

async function applyLines(tx: StockTx, farmerId: string, lines: TransferLine[], direction: 1 | -1) {
  for (const line of lines) {
    await incrementFarmerStock(tx, {
      farmerId,
      varietyId: line.varietyId,
      sizeId: line.sizeId,
      generationId: line.generationId,
      quantity: line.bagQuantity,
      direction,
    });
  }
}

async function requireReferences(tx: StockTx, data: CreateStockTransferBody) {
  const farmerRows = await tx
    .select({ id: farmers.id })
    .from(farmers)
    .where(inArray(farmers.id, [data.fromFarmerId, data.toFarmerId]));
  if (farmerRows.length !== 2) {
    throw new TransferFlowError("invalid_farmer", "Invalid source or destination farmer");
  }

  const varietyIds = [...new Set(data.lines.map((line) => line.varietyId))];
  const sizeIds = [...new Set(data.lines.map((line) => line.sizeId))];
  const generationIds = [...new Set(data.lines.map((line) => line.generationId))];

  const varietyRows = await tx
    .select({ id: varieties.id })
    .from(varieties)
    .where(inArray(varieties.id, varietyIds));
  const sizeRows = await tx
    .select({ id: seedSizes.id })
    .from(seedSizes)
    .where(inArray(seedSizes.id, sizeIds));
  const generationRows = await tx
    .select({ id: generations.id })
    .from(generations)
    .where(inArray(generations.id, generationIds));

  if (
    varietyRows.length !== varietyIds.length ||
    sizeRows.length !== sizeIds.length ||
    generationRows.length !== generationIds.length
  ) {
    throw new TransferFlowError("invalid_reference", "Invalid variety, seed size, or generation");
  }
}

export const stockTransfersService = {
  async getAllTransfers() {
    return await db.query.stockTransfers.findMany({
      orderBy: [desc(stockTransfers.createdAt)],
      with: transferWith,
    });
  },

  async getTransferById(id: string) {
    return await loadTransfer(id);
  },

  async createTransfer(data: CreateStockTransferBody, createdById: string) {
    return await runTransferFlow(async () => {
      const createdId = await db.transaction(async (tx) => {
        await requireReferences(tx, data);

        const balances = await lockFarmerBalances(tx, data.fromFarmerId);
        try {
          assertSufficientStock(
            balances,
            data.lines.map((line) => ({
              varietyId: line.varietyId,
              sizeId: line.sizeId,
              generationId: line.generationId,
              quantity: line.bagQuantity,
            })),
          );
        } catch (error) {
          rethrowStock(error, "insufficient_stock");
        }

        const [created] = await tx
          .insert(stockTransfers)
          .values({
            fromFarmerId: data.fromFarmerId,
            toFarmerId: data.toFarmerId,
            toLocation: data.toLocation,
            truckNumber: data.truckNumber,
            status: "PENDING",
            transferDate: data.transferDate ?? new Date(),
            driverMobile: data.driverMobile,
            manualGatePassNumber: data.manualGatePassNumber,
            weightSlipNumber: data.weightSlipNumber,
            grossWeight: data.grossWeight,
            tareWeight: data.tareWeight,
            netWeight: data.netWeight,
            remarks: data.remarks,
            createdById,
          })
          .returning({ id: stockTransfers.id });

        await tx.insert(stockTransferLines).values(
          data.lines.map((line) => ({
            stockTransferId: created.id,
            varietyId: line.varietyId,
            sizeId: line.sizeId,
            generationId: line.generationId,
            bagQuantity: line.bagQuantity,
          })),
        );

        try {
          await applyLines(tx, data.fromFarmerId, data.lines, -1);
        } catch (error) {
          rethrowStock(error, "insufficient_stock");
        }

        return created.id;
      });

      const created = await loadTransfer(createdId);
      if (!created) {
        throw new TransferFlowError("not_found", "Stock transfer not found");
      }
      return created;
    });
  },

  async confirmTransfer(id: string, userId: string) {
    return await runTransferFlow(async () => {
      await db.transaction(async (tx) => {
        const [transfer] = await tx
          .select()
          .from(stockTransfers)
          .where(eq(stockTransfers.id, id))
          .for("update")
          .limit(1);

        if (!transfer) {
          throw new TransferFlowError("not_found", "Stock transfer not found");
        }
        if (transfer.status === "RECEIVED") {
          return;
        }
        if (transfer.status !== "PENDING") {
          throw new TransferFlowError("already_null", "Transfer is nullified");
        }

        const lines = await tx
          .select({
            varietyId: stockTransferLines.varietyId,
            sizeId: stockTransferLines.sizeId,
            generationId: stockTransferLines.generationId,
            bagQuantity: stockTransferLines.bagQuantity,
          })
          .from(stockTransferLines)
          .where(eq(stockTransferLines.stockTransferId, id));

        await lockFarmerBalances(tx, transfer.toFarmerId);
        await applyLines(tx, transfer.toFarmerId, lines, 1);

        await tx
          .update(stockTransfers)
          .set({
            status: "RECEIVED",
            receivedAt: new Date(),
            receivedById: userId,
            updatedAt: new Date(),
          })
          .where(eq(stockTransfers.id, id));
      });

      const updated = await loadTransfer(id);
      if (!updated) {
        throw new TransferFlowError("not_found", "Stock transfer not found");
      }
      return updated;
    });
  },

  async nullifyTransfer(id: string) {
    return await runTransferFlow(async () => {
      await db.transaction(async (tx) => {
        const [transfer] = await tx
          .select()
          .from(stockTransfers)
          .where(eq(stockTransfers.id, id))
          .for("update")
          .limit(1);

        if (!transfer) {
          throw new TransferFlowError("not_found", "Stock transfer not found");
        }
        if (transfer.status === "NULL") {
          throw new TransferFlowError("already_null", "Transfer is already nullified");
        }

        const lines = await tx
          .select({
            varietyId: stockTransferLines.varietyId,
            sizeId: stockTransferLines.sizeId,
            generationId: stockTransferLines.generationId,
            bagQuantity: stockTransferLines.bagQuantity,
          })
          .from(stockTransferLines)
          .where(eq(stockTransferLines.stockTransferId, id));

        if (transfer.status === "RECEIVED") {
          const [firstFarmerId, secondFarmerId] = [
            transfer.fromFarmerId,
            transfer.toFarmerId,
          ].sort();
          const firstBalances = await lockFarmerBalances(tx, firstFarmerId);
          const secondBalances = await lockFarmerBalances(tx, secondFarmerId);
          const destinationBalances =
            transfer.toFarmerId === firstFarmerId ? firstBalances : secondBalances;

          try {
            assertSufficientStock(
              destinationBalances,
              lines.map((line) => ({
                varietyId: line.varietyId,
                sizeId: line.sizeId,
                generationId: line.generationId,
                quantity: line.bagQuantity,
              })),
            );
            await applyLines(tx, transfer.toFarmerId, lines, -1);
          } catch (error) {
            rethrowStock(error, "stock_debit_failed");
          }
        } else {
          await lockFarmerBalances(tx, transfer.fromFarmerId);
        }

        await applyLines(tx, transfer.fromFarmerId, lines, 1);

        await tx
          .update(stockTransfers)
          .set({ status: "NULL", updatedAt: new Date() })
          .where(and(eq(stockTransfers.id, id), eq(stockTransfers.status, transfer.status)));
      });

      const updated = await loadTransfer(id);
      if (!updated) {
        throw new TransferFlowError("not_found", "Stock transfer not found");
      }
      return updated;
    });
  },
};
