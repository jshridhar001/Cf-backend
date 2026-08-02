import type { FastifyInstance } from "fastify";
import {
  createPlantationHandler,
  deleteAllPlantationsForFieldHandler,
  deletePlantationHandler,
  getPlantationByIdHandler,
  getPlantationsByFieldIdHandler,
  updatePlantationHandler,
} from "@/features/plantation/plantation.controller.js";
import {
  createPlantationBodySchema,
  fieldIdParamSchema,
  plantationIdParamSchema,
  updatePlantationBodySchema,
} from "@/features/plantation/plantation.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function plantationRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/", { schema: { body: createPlantationBodySchema } }, createPlantationHandler);

  // Register /field/:fieldId before /:id so "field" is not treated as an id
  fastify.get(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    getPlantationsByFieldIdHandler,
  );

  fastify.delete(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    deleteAllPlantationsForFieldHandler,
  );

  fastify.get("/:id", { schema: { params: plantationIdParamSchema } }, getPlantationByIdHandler);

  fastify.patch(
    "/:id",
    { schema: { params: plantationIdParamSchema, body: updatePlantationBodySchema } },
    updatePlantationHandler,
  );

  fastify.delete("/:id", { schema: { params: plantationIdParamSchema } }, deletePlantationHandler);
}
