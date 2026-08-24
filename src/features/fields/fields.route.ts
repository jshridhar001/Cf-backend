import type { FastifyInstance } from "fastify";
import {
  createFieldHandler,
  deleteFieldHandler,
  getFieldActivitiesByIdHandler,
  getFieldByIdHandler,
  getFieldsHandler,
  updateFieldBoundaryHandler,
  updateFieldHandler,
} from "@/features/fields/fields.controller.js";
import {
  createFieldBodySchema,
  fieldIdParamSchema,
  getFieldsQuerySchema,
  updateBoundaryBodySchema,
  updateFieldBodySchema,
} from "@/features/fields/fields.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function fieldRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/", { schema: { body: createFieldBodySchema } }, createFieldHandler);

  fastify.get("/", { schema: { querystring: getFieldsQuerySchema } }, getFieldsHandler);

  fastify.get(
    "/:id/activities",
    { schema: { params: fieldIdParamSchema } },
    getFieldActivitiesByIdHandler,
  );

  fastify.get("/:id", { schema: { params: fieldIdParamSchema } }, getFieldByIdHandler);

  fastify.patch(
    "/:id/boundary",
    { schema: { params: fieldIdParamSchema, body: updateBoundaryBodySchema } },
    updateFieldBoundaryHandler,
  );

  fastify.patch(
    "/:id",
    { schema: { params: fieldIdParamSchema, body: updateFieldBodySchema } },
    updateFieldHandler,
  );

  fastify.delete("/:id", { schema: { params: fieldIdParamSchema } }, deleteFieldHandler);
}
