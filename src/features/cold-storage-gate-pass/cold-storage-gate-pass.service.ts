import type { ExtractTablesWithRelations } from "drizzle-orm";
import { and, desc, eq, sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "@/db/index.js";
import { coldStorageGatePasses } from "@/db/schema/cold-storage-gate-pass.js";
import { facilityStocks } from "@/db/schema/facility-stock.js";
import type * as schema from "@/db/schema/index.js";
import { facilities, generations, seedSizes, varieties } from "@/db/schema/masters.js";
import type {
  CreateColdStorageGatePassBody,
  UpdateColdStorageGatePassBody,
} from "@/features/cold-storage-gate-pass/cold-storage-gate-pass.schema.js";

const gatePassWith = {
  facility: true,
  variety: true,
  generation: true,
  size: true,
} as const;

type DbTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

type StockTarget = {
  facilityId: string;
  varietyId: string;
  sizeId: string;
  generationId: string;
  quantity: number;
};

export class ColdStorageGatePassCrudError extends Error {
  statusCode: 400 | 404 | 409;

  constructor(statusCode: 400 | 404 | 409, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function assertIdExists(
  id: string,
  find: (id: string) => Promise<{ id: string } | undefined>,
  statusCode: 400 | 404,
  message: string,
) {
  const row = await find(id);
  if (!row) {
    throw new ColdStorageGatePassCrudError(statusCode, message);
  }
}

async function findFacility(id: string) {
  const [row] = await db
    .select({ id: facilities.id })
    .from(facilities)
    .where(eq(facilities.id, id))
    .limit(1);
  return row;
}

async function findVariety(id: string) {
  const [row] = await db
    .select({ id: varieties.id })
    .from(varieties)
    .where(eq(varieties.id, id))
    .limit(1);
  return row;
}

async function findSeedSize(id: string) {
  const [row] = await db
    .select({ id: seedSizes.id })
    .from(seedSizes)
    .where(eq(seedSizes.id, id))
    .limit(1);
  return row;
}

async function findGeneration(id: string) {
  const [row] = await db
    .select({ id: generations.id })
    .from(generations)
    .where(eq(generations.id, id))
    .limit(1);
  return row;
}

async function loadGatePass(id: string) {
  return await db.query.coldStorageGatePasses.findFirst({
    where: eq(coldStorageGatePasses.id, id),
    with: gatePassWith,
  });
}

function sameStockTarget(left: StockTarget, right: StockTarget) {
  return (
    left.facilityId === right.facilityId &&
    left.varietyId === right.varietyId &&
    left.sizeId === right.sizeId &&
    left.generationId === right.generationId &&
    left.quantity === right.quantity
  );
}

async function applyStockChange(
  tx: DbTransaction,
  target: StockTarget,
  direction: "debit" | "credit",
) {
  const [stock] = await tx
    .select({
      id: facilityStocks.id,
      currentQuantity: facilityStocks.currentQuantity,
    })
    .from(facilityStocks)
    .where(
      and(
        eq(facilityStocks.facilityId, target.facilityId),
        eq(facilityStocks.varietyId, target.varietyId),
        eq(facilityStocks.sizeId, target.sizeId),
        eq(facilityStocks.generationId, target.generationId),
      ),
    )
    .for("update");

  if (!stock) {
    throw new ColdStorageGatePassCrudError(
      409,
      direction === "debit"
        ? "No cold storage stock for this facility, variety, size, and generation."
        : "Cold storage stock row is missing; cannot restore quantity.",
    );
  }

  if (direction === "debit" && stock.currentQuantity < target.quantity) {
    throw new ColdStorageGatePassCrudError(
      409,
      `Gate pass quantity exceeds current cold storage stock (have ${stock.currentQuantity}, need ${target.quantity}).`,
    );
  }

  await tx
    .update(facilityStocks)
    .set({
      currentQuantity:
        direction === "debit"
          ? sql`${facilityStocks.currentQuantity} - ${target.quantity}`
          : sql`${facilityStocks.currentQuantity} + ${target.quantity}`,
    })
    .where(eq(facilityStocks.id, stock.id));
}

export const coldStorageGatePassService = {
  async getAllGatePasses() {
    return await db.query.coldStorageGatePasses.findMany({
      orderBy: [desc(coldStorageGatePasses.gatePassDate), desc(coldStorageGatePasses.createdAt)],
      with: gatePassWith,
    });
  },

  async getGatePassById(id: string) {
    return await loadGatePass(id);
  },

  async createGatePass(data: CreateColdStorageGatePassBody) {
    await assertIdExists(data.facilityId, findFacility, 404, "Facility not found.");
    await assertIdExists(data.varietyId, findVariety, 400, "Variety not found.");
    await assertIdExists(data.generationId, findGeneration, 400, "Generation not found.");
    await assertIdExists(data.sizeId, findSeedSize, 400, "Seed size not found.");

    const createdId = await db.transaction(async (tx) => {
      await applyStockChange(tx, data, "debit");
      const [created] = await tx.insert(coldStorageGatePasses).values(data).returning({
        id: coldStorageGatePasses.id,
      });
      return created.id;
    });

    return await loadGatePass(createdId);
  },

  async updateGatePass(id: string, data: UpdateColdStorageGatePassBody) {
    if (data.facilityId) {
      await assertIdExists(data.facilityId, findFacility, 404, "Facility not found.");
    }
    if (data.varietyId) {
      await assertIdExists(data.varietyId, findVariety, 400, "Variety not found.");
    }
    if (data.generationId) {
      await assertIdExists(data.generationId, findGeneration, 400, "Generation not found.");
    }
    if (data.sizeId) {
      await assertIdExists(data.sizeId, findSeedSize, 400, "Seed size not found.");
    }

    const updatedId = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(coldStorageGatePasses)
        .where(eq(coldStorageGatePasses.id, id))
        .for("update");

      if (!existing) {
        return undefined;
      }

      if (existing.status === "NULL") {
        throw new ColdStorageGatePassCrudError(409, "A nullified gate pass cannot be edited.");
      }

      const next: StockTarget = {
        facilityId: data.facilityId ?? existing.facilityId,
        varietyId: data.varietyId ?? existing.varietyId,
        sizeId: data.sizeId ?? existing.sizeId,
        generationId: data.generationId ?? existing.generationId,
        quantity: data.quantity ?? existing.quantity,
      };
      const previous: StockTarget = {
        facilityId: existing.facilityId,
        varietyId: existing.varietyId,
        sizeId: existing.sizeId,
        generationId: existing.generationId,
        quantity: existing.quantity,
      };

      if (!sameStockTarget(previous, next)) {
        await applyStockChange(tx, previous, "credit");
        await applyStockChange(tx, next, "debit");
      }

      await tx.update(coldStorageGatePasses).set(data).where(eq(coldStorageGatePasses.id, id));
      return id;
    });

    if (!updatedId) {
      return undefined;
    }

    return await loadGatePass(updatedId);
  },

  async deleteGatePass(id: string) {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(coldStorageGatePasses)
        .where(eq(coldStorageGatePasses.id, id))
        .for("update");

      if (!existing) {
        return undefined;
      }

      if (existing.status === "ACTIVE") {
        await applyStockChange(
          tx,
          {
            facilityId: existing.facilityId,
            varietyId: existing.varietyId,
            sizeId: existing.sizeId,
            generationId: existing.generationId,
            quantity: existing.quantity,
          },
          "credit",
        );
      }

      const [deleted] = await tx
        .delete(coldStorageGatePasses)
        .where(eq(coldStorageGatePasses.id, id))
        .returning();
      return deleted;
    });
  },

  async nullifyGatePass(id: string) {
    const updatedId = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(coldStorageGatePasses)
        .where(eq(coldStorageGatePasses.id, id))
        .for("update");

      if (!existing) {
        return undefined;
      }

      if (existing.status === "NULL") {
        throw new ColdStorageGatePassCrudError(409, "Gate pass is already nullified.");
      }

      await applyStockChange(
        tx,
        {
          facilityId: existing.facilityId,
          varietyId: existing.varietyId,
          sizeId: existing.sizeId,
          generationId: existing.generationId,
          quantity: existing.quantity,
        },
        "credit",
      );

      await tx
        .update(coldStorageGatePasses)
        .set({ status: "NULL" })
        .where(eq(coldStorageGatePasses.id, id));

      return id;
    });

    if (!updatedId) {
      return undefined;
    }

    return await loadGatePass(updatedId);
  },
};
