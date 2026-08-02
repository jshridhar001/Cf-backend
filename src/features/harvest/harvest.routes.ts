import type { FastifyInstance } from "fastify";
import {
  createHarvestHandler,
  deleteAllHarvestsForFieldHandler,
  deleteHarvestHandler,
  getHarvestByIdHandler,
  getHarvestsByFieldIdHandler,
  updateHarvestHandler,
} from "@/features/harvest/harvest.controller.js";
import {
  createHarvestBodySchema,
  fieldIdParamSchema,
  harvestIdParamSchema,
  updateHarvestBodySchema,
} from "@/features/harvest/harvest.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function harvestRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/", { schema: { body: createHarvestBodySchema } }, createHarvestHandler);

  // Register /field/:fieldId before /:id so "field" is not treated as an id
  fastify.get(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    getHarvestsByFieldIdHandler,
  );

  fastify.delete(
    "/field/:fieldId",
    { schema: { params: fieldIdParamSchema } },
    deleteAllHarvestsForFieldHandler,
  );

  fastify.get("/:id", { schema: { params: harvestIdParamSchema } }, getHarvestByIdHandler);

  fastify.patch(
    "/:id",
    { schema: { params: harvestIdParamSchema, body: updateHarvestBodySchema } },
    updateHarvestHandler,
  );

  fastify.delete("/:id", { schema: { params: harvestIdParamSchema } }, deleteHarvestHandler);
}
