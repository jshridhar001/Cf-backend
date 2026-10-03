import type { FastifyInstance } from "fastify";
import * as generationsController from "@/features/master/generations/generations.controller.js";
import {
  createGenerationBodySchema,
  generationIdParamSchema,
  updateGenerationBodySchema,
} from "@/features/master/generations/generations.schema.js";

export async function generationRoutes(fastify: FastifyInstance) {
  // --- READ ---
  fastify.get("/", generationsController.getAllGenerations);

  // --- CREATE ---
  fastify.post(
    "/",
    {
      schema: { body: createGenerationBodySchema },
    },
    generationsController.createGeneration,
  );

  // --- UPDATE ---
  fastify.put(
    "/:id",
    {
      schema: { params: generationIdParamSchema, body: updateGenerationBodySchema },
    },
    generationsController.updateGeneration,
  );

  // --- DELETE SINGLE ---
  fastify.delete(
    "/:id",
    {
      schema: { params: generationIdParamSchema },
    },
    generationsController.deleteGeneration,
  );

  // --- DELETE ALL (DANGER ⚠️) ---
  fastify.delete("/all", generationsController.deleteAllGenerations);
}
