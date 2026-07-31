import type { FastifyInstance } from "fastify";
import * as seedSizesController from "@/features/master/seed-size/seed-size.controller.js";
import {
  createSeedSizeBodySchema,
  seedSizeIdParamSchema,
  updateSeedSizeBodySchema,
} from "@/features/master/seed-size/seed-size.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function seedSizeRoutes(fastify: FastifyInstance) {
  // 🛡️ Apply Head Office protection to ALL routes in this plugin
  fastify.addHook("preHandler", requireHeadOffice);

  fastify.get("/", seedSizesController.getAllSeedSizes);

  fastify.post(
    "/",
    { schema: { body: createSeedSizeBodySchema } },
    seedSizesController.createSeedSize,
  );

  fastify.put(
    "/:id",
    { schema: { params: seedSizeIdParamSchema, body: updateSeedSizeBodySchema } },
    seedSizesController.updateSeedSize,
  );

  fastify.delete(
    "/:id",
    { schema: { params: seedSizeIdParamSchema } },
    seedSizesController.deleteSeedSize,
  );

  fastify.delete("/all", seedSizesController.deleteAllSeedSizes);
}
