import type { FastifyInstance } from "fastify";
import * as statesController from "@/features/master/states/states.controller.js";
import {
  createStateBodySchema,
  stateIdParamSchema,
  updateStateBodySchema,
} from "@/features/master/states/states.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function stateRoutes(fastify: FastifyInstance) {
  // 🛡️ Apply Head Office protection to ALL routes in this plugin
  // SUPER_DEVELOPER | MANAGING_DIRECTOR | PROGRAMME_MANAGER
  fastify.addHook("preHandler", requireHeadOffice);

  // --- READ ---
  fastify.get("/", statesController.getAllStates);

  // --- CREATE ---
  fastify.post(
    "/",
    {
      schema: { body: createStateBodySchema },
    },
    statesController.createState,
  );

  // --- UPDATE ---
  fastify.put(
    "/:id",
    {
      schema: { params: stateIdParamSchema, body: updateStateBodySchema },
    },
    statesController.updateState,
  );

  // --- DELETE SINGLE ---
  fastify.delete(
    "/:id",
    {
      schema: { params: stateIdParamSchema },
    },
    statesController.deleteState,
  );

  // --- DELETE ALL (DANGER ⚠️) ---
  fastify.delete("/all", statesController.deleteAllStates);
}
