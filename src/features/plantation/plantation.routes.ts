import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as plantationController from "@/features/plantation/plantation.controller.js";
import {
  createPlantationBodySchema,
  listPlantationQuerySchema,
  plantationIdParamSchema,
  updatePlantationBodySchema,
} from "@/features/plantation/plantation.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const plantationRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get(
    "/",
    { schema: { querystring: listPlantationQuerySchema } },
    plantationController.getAllPlantations,
  );

  fastify.get(
    "/:id",
    { schema: { params: plantationIdParamSchema } },
    plantationController.getPlantationById,
  );

  fastify.post(
    "/",
    { schema: { body: createPlantationBodySchema } },
    plantationController.createPlantation,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        params: plantationIdParamSchema,
        body: updatePlantationBodySchema,
      },
    },
    plantationController.updatePlantation,
  );

  fastify.delete(
    "/:id",
    { schema: { params: plantationIdParamSchema } },
    plantationController.deletePlantation,
  );
};
