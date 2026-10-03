import type { FastifyInstance } from "fastify";
import * as villagesController from "@/features/master/villages/villages.controller.js";
import {
  createVillageBodySchema,
  updateVillageBodySchema,
  villageIdParamSchema,
} from "@/features/master/villages/villages.schema.js";

export async function villageRoutes(fastify: FastifyInstance) {
  // --- READ ---
  fastify.get("/", villagesController.getAllVillages);

  // --- CREATE ---
  fastify.post(
    "/",
    {
      schema: { body: createVillageBodySchema },
    },
    villagesController.createVillage,
  );

  // --- UPDATE ---
  fastify.put(
    "/:id",
    {
      schema: { params: villageIdParamSchema, body: updateVillageBodySchema },
    },
    villagesController.updateVillage,
  );

  // --- DELETE SINGLE ---
  fastify.delete(
    "/:id",
    {
      schema: { params: villageIdParamSchema },
    },
    villagesController.deleteVillage,
  );

  // --- DELETE ALL (DANGER ⚠️) ---
  fastify.delete("/all", villagesController.deleteAllVillages);
}
