import type { FastifyInstance } from "fastify";
import * as varietiesController from "@/features/master/varieties/varieties.controller.js";
import {
  createVarietyBodySchema,
  updateVarietyBodySchema,
  varietyIdParamSchema,
} from "@/features/master/varieties/varieties.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function varietyRoutes(fastify: FastifyInstance) {
  // 🛡️ Apply Head Office protection to ALL routes in this plugin
  // SUPER_DEVELOPER | MANAGING_DIRECTOR | PROGRAMME_MANAGER
  fastify.addHook("preHandler", requireHeadOffice);

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
