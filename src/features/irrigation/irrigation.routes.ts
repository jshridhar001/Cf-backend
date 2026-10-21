import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as irrigationController from "@/features/irrigation/irrigation.controller.js";
import {
  createIrrigationBodySchema,
  irrigationIdParamSchema,
  listIrrigationQuerySchema,
  updateIrrigationBodySchema,
} from "@/features/irrigation/irrigation.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const irrigationRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get(
    "/",
    { schema: { querystring: listIrrigationQuerySchema } },
    irrigationController.getAllIrrigations,
  );

  fastify.get(
    "/:id",
    { schema: { params: irrigationIdParamSchema } },
    irrigationController.getIrrigationById,
  );

  fastify.post(
    "/",
    { schema: { body: createIrrigationBodySchema } },
    irrigationController.createIrrigation,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        params: irrigationIdParamSchema,
        body: updateIrrigationBodySchema,
      },
    },
    irrigationController.updateIrrigation,
  );

  fastify.delete(
    "/:id",
    { schema: { params: irrigationIdParamSchema } },
    irrigationController.deleteIrrigation,
  );
};
