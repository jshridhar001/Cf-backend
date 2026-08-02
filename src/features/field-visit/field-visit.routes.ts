import type { FastifyInstance } from "fastify";
import {
  createFieldVisitHandler,
  deleteAllFieldVisitsForFieldHandler,
  deleteFieldVisitHandler,
  getFieldVisitByIdHandler,
  getFieldVisitsByFieldIdHandler,
  updateFieldVisitHandler,
} from "@/features/field-visit/field-visit.controller.js";
import {
  createFieldVisitBodySchema,
  fieldIdParamSchema,
  fieldVisitIdParamSchema,
  updateFieldVisitBodySchema,
} from "@/features/field-visit/field-visit.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function fieldVisitRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/", { schema: { body: createFieldVisitBodySchema } }, createFieldVisitHandler);

  // Register /field/:fieldId before /:id so "field" is not treated as an id
  fastify.get(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    getFieldVisitsByFieldIdHandler,
  );

  fastify.delete(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    deleteAllFieldVisitsForFieldHandler,
  );

  fastify.get("/:id", { schema: { params: fieldVisitIdParamSchema } }, getFieldVisitByIdHandler);

  fastify.patch(
    "/:id",
    { schema: { params: fieldVisitIdParamSchema, body: updateFieldVisitBodySchema } },
    updateFieldVisitHandler,
  );

  fastify.delete("/:id", { schema: { params: fieldVisitIdParamSchema } }, deleteFieldVisitHandler);
}
