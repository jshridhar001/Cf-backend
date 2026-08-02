import type { FastifyInstance } from "fastify";
import {
  createStripTestHandler,
  deleteAllStripTestsForFieldHandler,
  deleteStripTestHandler,
  getStripTestByIdHandler,
  getStripTestsByFieldIdHandler,
} from "@/features/strip-test/strip-test.controller.js";
import {
  createStripTestBodySchema,
  fieldIdParamSchema,
  stripTestIdParamSchema,
} from "@/features/strip-test/strip-test.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function stripTestRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/", { schema: { body: createStripTestBodySchema } }, createStripTestHandler);

  // Register /field/:fieldId before /:id so "field" is not treated as an id
  fastify.get(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    getStripTestsByFieldIdHandler,
  );

  fastify.delete(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    deleteAllStripTestsForFieldHandler,
  );

  fastify.get("/:id", { schema: { params: stripTestIdParamSchema } }, getStripTestByIdHandler);

  fastify.delete("/:id", { schema: { params: stripTestIdParamSchema } }, deleteStripTestHandler);
}
