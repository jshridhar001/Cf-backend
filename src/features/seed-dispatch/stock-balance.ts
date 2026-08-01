import { and, eq } from "drizzle-orm";
import { farmerStockBalances } from "@/db/schema/farmer-stock.js";
import { dispatchRequisitionSizeLines } from "@/db/schema/seed-dispatch.js";
import { formatDecimal, parseDecimal, round2 } from "@/features/seed-dispatch/quantity.js";
import { stockKey } from "@/features/seed-dispatch/stock-key.js";

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

type DbLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tx shares db query API
  select: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tx shares db query API
  insert: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tx shares db query API
  update: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tx shares db query API
  delete: (...args: any[]) => any;
};

export async function incrementFarmerStock(
  tx: DbLike,
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
    const next = round2((existing ? parseDecimal(existing.balance) : 0) + input.quantity);
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

  const next = round2(parseDecimal(existing.balance) - input.quantity);
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
  tx: DbLike,
  input: {
    dispatchRequisitionId: string;
    farmerId: string;
    varietyId: string;
  },
) {
  const lines: Array<{
    sizeId: string;
    generationId: string;
    bagQuantity: number;
  }> = await tx
    .select({
      sizeId: dispatchRequisitionSizeLines.sizeId,
      generationId: dispatchRequisitionSizeLines.generationId,
      bagQuantity: dispatchRequisitionSizeLines.bagQuantity,
    })
    .from(dispatchRequisitionSizeLines)
    .where(eq(dispatchRequisitionSizeLines.dispatchRequisitionId, input.dispatchRequisitionId));

  for (const line of lines) {
    const qty = line.bagQuantity;
    if (qty <= 0) continue;

    await incrementFarmerStock(tx, {
      farmerId: input.farmerId,
      varietyId: input.varietyId,
      sizeId: line.sizeId,
      generationId: line.generationId,
      quantity: qty,
      direction: 1,
    });
  }
}

export async function debitFarmerStockFromLot(
  tx: DbLike,
  input: {
    dispatchRequisitionId: string;
    farmerId: string;
    varietyId: string;
  },
) {
  const lines: Array<{
    sizeId: string;
    generationId: string;
    bagQuantity: number;
  }> = await tx
    .select({
      sizeId: dispatchRequisitionSizeLines.sizeId,
      generationId: dispatchRequisitionSizeLines.generationId,
      bagQuantity: dispatchRequisitionSizeLines.bagQuantity,
    })
    .from(dispatchRequisitionSizeLines)
    .where(eq(dispatchRequisitionSizeLines.dispatchRequisitionId, input.dispatchRequisitionId));

  for (const line of lines) {
    const qty = line.bagQuantity;
    if (qty <= 0) continue;

    await incrementFarmerStock(tx, {
      farmerId: input.farmerId,
      varietyId: input.varietyId,
      sizeId: line.sizeId,
      generationId: line.generationId,
      quantity: qty,
      direction: -1,
    });
  }
}
