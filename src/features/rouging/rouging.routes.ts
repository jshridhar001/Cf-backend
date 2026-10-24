import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as rougingController from "@/features/rouging/rouging.controller.js";
import {
  createRougingBodySchema,
  listRougingQuerySchema,
  rougingIdParamSchema,
  updateRougingBodySchema,
} from "@/features/rouging/rouging.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const rougingRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get(
    "/",
    { schema: { querystring: listRougingQuerySchema } },
    rougingController.getAllRougings,
  );

  fastify.get(
    "/:id",
    { schema: { params: rougingIdParamSchema } },
    rougingController.getRougingById,
  );

  fastify.post("/", { schema: { body: createRougingBodySchema } }, rougingController.createRouging);

  fastify.put(
    "/:id",
    {
      schema: {
        params: rougingIdParamSchema,
        body: updateRougingBodySchema,
      },
    },
    rougingController.updateRouging,
  );

  fastify.delete(
    "/:id",
    { schema: { params: rougingIdParamSchema } },
    rougingController.deleteRouging,
  );
};
