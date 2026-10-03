import type { FastifyInstance } from "fastify";
import * as statesController from "@/features/master/states/states.controller.js";
import {
  createStateBodySchema,
  stateIdParamSchema,
  updateStateBodySchema,
} from "@/features/master/states/states.schema.js";

export async function stateRoutes(fastify: FastifyInstance) {
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
