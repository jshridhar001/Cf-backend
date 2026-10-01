import type { ExtractTablesWithRelations } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { farmerStockBalances } from "@/db/schema/farmer-stock.js";
import type * as schema from "@/db/schema/index.js";
import { dispatchRequisitionSizeLines } from "@/db/schema/seed-dispatch.js";
import { formatDecimal, parseDecimal, roundDecimal } from "@/features/seed-dispatch/quantity.js";
import { stockKey } from "@/features/seed-dispatch/stock-key.js";

type DbExecutor = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type StockLineInput = {
  varietyId: string;
  sizeId: string;
  generationId: string;
  quantity: number;
};

export type StockBalanceRow = {
  varietyId: string;
  sizeId: string;
  generationId: string;
  balance: string | number;
};

export { stockKey };

export function assertSufficientStock(balances: StockBalanceRow[], lines: StockLineInput[]) {
  const available = new Map<string, number>();
  for (const row of balances) {
    available.set(
      stockKey(row.varietyId, row.sizeId, row.generationId),
      parseDecimal(String(row.balance)),
    );
  }

  for (const line of lines) {
    const key = stockKey(line.varietyId, line.sizeId, line.generationId);
    const have = available.get(key) ?? 0;
    if (line.quantity > have) {
      throw new Error(
        `Transfer quantity exceeds available stock for ${key} (have ${have}, need ${line.quantity}).`,
      );
    }
  }
}

export async function incrementFarmerStock(
  tx: DbExecutor,
  input: {
    farmerId: string;
    varietyId: string;
    sizeId: string;
    generationId: string;
    quantity: number;
    direction: 1 | -1;
  },
) {
  if (input.quantity <= 0) {
    throw new Error("Stock quantity must be positive.");
  }

  const [existing] = await tx
    .select({
      id: farmerStockBalances.id,
      balance: farmerStockBalances.balance,
    })
    .from(farmerStockBalances)
    .where(
      and(
        eq(farmerStockBalances.farmerId, input.farmerId),
        eq(farmerStockBalances.varietyId, input.varietyId),
        eq(farmerStockBalances.sizeId, input.sizeId),
        eq(farmerStockBalances.generationId, input.generationId),
      ),
    )
    .limit(1);

  if (input.direction === 1) {
    const next = roundDecimal((existing ? parseDecimal(existing.balance) : 0) + input.quantity);
    const nextText = formatDecimal(next);

    if (existing) {
      await tx
        .update(farmerStockBalances)
        .set({ balance: nextText, updatedAt: new Date() })
        .where(eq(farmerStockBalances.id, existing.id));
      return;
    }

    await tx.insert(farmerStockBalances).values({
      farmerId: input.farmerId,
      varietyId: input.varietyId,
      sizeId: input.sizeId,
      generationId: input.generationId,
      balance: nextText,
    });
    return;
  }

  if (!existing) {
    throw new Error("Stock debit exceeds available balance.");
  }

  const next = roundDecimal(parseDecimal(existing.balance) - input.quantity);
  if (next < 0) {
    throw new Error("Stock debit exceeds available balance.");
  }

  if (next === 0) {
    await tx.delete(farmerStockBalances).where(eq(farmerStockBalances.id, existing.id));
    return;
  }

  await tx
    .update(farmerStockBalances)
    .set({ balance: formatDecimal(next), updatedAt: new Date() })
    .where(eq(farmerStockBalances.id, existing.id));
}

export async function creditFarmerStockFromLot(
  tx: DbExecutor,
  input: {
    dispatchRequisitionId: string;
    farmerId: string;
    varietyId: string;
  },
) {
  const lines = await tx
    .select({
      sizeId: dispatchRequisitionSizeLines.sizeId,
      generationId: dispatchRequisitionSizeLines.generationId,
      bagQuantity: dispatchRequisitionSizeLines.bagQuantity,
    })
    .from(dispatchRequisitionSizeLines)
    .where(eq(dispatchRequisitionSizeLines.dispatchRequisitionId, input.dispatchRequisitionId));

  for (const line of lines) {
    if (line.bagQuantity <= 0) continue;

    await incrementFarmerStock(tx, {
      farmerId: input.farmerId,
      varietyId: input.varietyId,
      sizeId: line.sizeId,
      generationId: line.generationId,
      quantity: line.bagQuantity,
      direction: 1,
    });
  }
}

export async function debitFarmerStockFromLot(
  tx: DbExecutor,
  input: {
    dispatchRequisitionId: string;
    farmerId: string;
    varietyId: string;
  },
) {
  const lines = await tx
    .select({
      sizeId: dispatchRequisitionSizeLines.sizeId,
      generationId: dispatchRequisitionSizeLines.generationId,
      bagQuantity: dispatchRequisitionSizeLines.bagQuantity,
    })
    .from(dispatchRequisitionSizeLines)
    .where(eq(dispatchRequisitionSizeLines.dispatchRequisitionId, input.dispatchRequisitionId));

  for (const line of lines) {
    if (line.bagQuantity <= 0) continue;

    await incrementFarmerStock(tx, {
      farmerId: input.farmerId,
      varietyId: input.varietyId,
      sizeId: line.sizeId,
      generationId: line.generationId,
      quantity: line.bagQuantity,
      direction: -1,
    });
  }
}
