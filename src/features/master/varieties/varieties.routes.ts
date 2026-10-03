import type { FastifyInstance } from "fastify";
import * as varietiesController from "@/features/master/varieties/varieties.controller.js";
import {
  createVarietyBodySchema,
  updateVarietyBodySchema,
  varietyIdParamSchema,
} from "@/features/master/varieties/varieties.schema.js";

export async function varietyRoutes(fastify: FastifyInstance) {
  // --- READ ---
  fastify.get("/", varietiesController.getAllVarieties);

  // --- CREATE ---
  fastify.post(
    "/",
    {
      schema: { body: createVarietyBodySchema },
    },
    varietiesController.createVariety,
  );

  // --- UPDATE ---
  fastify.put(
    "/:id",
    {
      schema: { params: varietyIdParamSchema, body: updateVarietyBodySchema },
    },
    varietiesController.updateVariety,
  );

  // --- DELETE SINGLE ---
  fastify.delete(
    "/:id",
    {
      schema: { params: varietyIdParamSchema },
    },
    varietiesController.deleteVariety,
  );

  // --- DELETE ALL (DANGER ⚠️) ---
  fastify.delete("/all", varietiesController.deleteAllVarieties);
}
