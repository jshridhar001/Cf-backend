import { desc, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { dispatches } from "@/db/schema/seed-dispatch.js";

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

export const seedDispatchesService = {
  async getAllDispatches() {
    return await db.query.dispatches.findMany({
      orderBy: [desc(dispatches.createdAt)],
      with: dispatchWith,
    });
  },

  async getDispatchById(id: string) {
    return await db.query.dispatches.findFirst({
      where: eq(dispatches.id, id),
      with: dispatchWith,
    });
  },
};
