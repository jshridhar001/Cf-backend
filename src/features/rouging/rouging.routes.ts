import type { FastifyInstance } from "fastify";
import {
  createRougingHandler,
  deleteAllRougingsForFieldHandler,
  deleteRougingHandler,
  getRougingByIdHandler,
  getRougingsByFieldIdHandler,
  updateRougingHandler,
} from "@/features/rouging/rouging.controller.js";
import {
  createRougingBodySchema,
  fieldIdParamSchema,
  rougingIdParamSchema,
  updateRougingBodySchema,
} from "@/features/rouging/rouging.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function rougingRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/", { schema: { body: createRougingBodySchema } }, createRougingHandler);

  // Register /field/:fieldId before /:id so "field" is not treated as an id
  fastify.get(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    getRougingsByFieldIdHandler,
  );

  fastify.delete(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    deleteAllRougingsForFieldHandler,
  );

  fastify.get("/:id", { schema: { params: rougingIdParamSchema } }, getRougingByIdHandler);

  fastify.patch(
    "/:id",
    { schema: { params: rougingIdParamSchema, body: updateRougingBodySchema } },
    updateRougingHandler,
  );

  fastify.delete("/:id", { schema: { params: rougingIdParamSchema } }, deleteRougingHandler);
}
