import type { FastifyInstance } from "fastify";
import {
  createFieldHandler,
  deleteFieldHandler,
  getFieldByIdHandler,
  getFieldsHandler,
  updateFieldHandler,
} from "@/features/fields/fields.controller.js";
import {
  createFieldBodySchema,
  fieldIdParamSchema,
  getFieldsQuerySchema,
  updateFieldBodySchema,
} from "@/features/fields/fields.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function fieldRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/", { schema: { body: createFieldBodySchema } }, createFieldHandler);

  fastify.get("/", { schema: { querystring: getFieldsQuerySchema } }, getFieldsHandler);

  fastify.get("/:id", { schema: { params: fieldIdParamSchema } }, getFieldByIdHandler);

  fastify.patch(
    "/:id",
    { schema: { params: fieldIdParamSchema, body: updateFieldBodySchema } },
    updateFieldHandler,
  );

  fastify.delete("/:id", { schema: { params: fieldIdParamSchema } }, deleteFieldHandler);
}
