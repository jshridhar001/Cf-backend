import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as seedDispatchesController from "@/features/seed-dispatch/seed-dispatch.controller.js";
import { dispatchIdParamSchema } from "@/features/seed-dispatch/seed-dispatch.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const seedDispatchRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/", seedDispatchesController.getAllDispatches);

  fastify.get(
    "/:id",
    { schema: { params: dispatchIdParamSchema } },
    seedDispatchesController.getDispatchById,
  );
};
