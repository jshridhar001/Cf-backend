import type { FastifyInstance } from "fastify";
import {
  createDehaulmingHandler,
  deleteAllDehaulmingsForFieldHandler,
  deleteDehaulmingHandler,
  getDehaulmingByIdHandler,
  getDehaulmingsByFieldIdHandler,
  updateDehaulmingHandler,
} from "@/features/dehaulming/dehaulming.controller.js";
import {
  createDehaulmingBodySchema,
  dehaulmingIdParamSchema,
  fieldIdParamSchema,
  updateDehaulmingBodySchema,
} from "@/features/dehaulming/dehaulming.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function dehaulmingRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/", { schema: { body: createDehaulmingBodySchema } }, createDehaulmingHandler);

  // Register /field/:fieldId before /:id so "field" is not treated as an id
  fastify.get(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    getDehaulmingsByFieldIdHandler,
  );

  fastify.delete(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    deleteAllDehaulmingsForFieldHandler,
  );

  fastify.get("/:id", { schema: { params: dehaulmingIdParamSchema } }, getDehaulmingByIdHandler);

  fastify.patch(
    "/:id",
    { schema: { params: dehaulmingIdParamSchema, body: updateDehaulmingBodySchema } },
    updateDehaulmingHandler,
  );

  fastify.delete("/:id", { schema: { params: dehaulmingIdParamSchema } }, deleteDehaulmingHandler);
}
