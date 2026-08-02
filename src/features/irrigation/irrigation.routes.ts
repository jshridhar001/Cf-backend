import type { FastifyInstance } from "fastify";
import {
  createIrrigationHandler,
  deleteAllIrrigationsForFieldHandler,
  deleteIrrigationHandler,
  getIrrigationByIdHandler,
  getIrrigationsByFieldIdHandler,
  updateIrrigationHandler,
} from "@/features/irrigation/irrigation.controller.js";
import {
  createIrrigationBodySchema,
  fieldIdParamSchema,
  irrigationIdParamSchema,
  updateIrrigationBodySchema,
} from "@/features/irrigation/irrigation.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function irrigationRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/", { schema: { body: createIrrigationBodySchema } }, createIrrigationHandler);

  // Register /field/:fieldId before /:id so "field" is not treated as an id
  fastify.get(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    getIrrigationsByFieldIdHandler,
  );

  fastify.delete(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    deleteAllIrrigationsForFieldHandler,
  );

  fastify.get("/:id", { schema: { params: irrigationIdParamSchema } }, getIrrigationByIdHandler);

  fastify.patch(
    "/:id",
    { schema: { params: irrigationIdParamSchema, body: updateIrrigationBodySchema } },
    updateIrrigationHandler,
  );

  fastify.delete("/:id", { schema: { params: irrigationIdParamSchema } }, deleteIrrigationHandler);
}
