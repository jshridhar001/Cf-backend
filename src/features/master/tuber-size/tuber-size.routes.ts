import type { FastifyInstance } from "fastify";
import * as tuberSizesController from "@/features/master/tuber-size/tuber-size.controller.js";
import {
  createTuberSizeBodySchema,
  tuberSizeIdParamSchema,
  updateTuberSizeBodySchema,
} from "@/features/master/tuber-size/tuber-size.schema.js";

export async function tuberSizeRoutes(fastify: FastifyInstance) {
  fastify.get("/", tuberSizesController.getAllTuberSizes);

  fastify.post(
    "/",
    { schema: { body: createTuberSizeBodySchema } },
    tuberSizesController.createTuberSize,
  );

  fastify.put(
    "/:id",
    { schema: { params: tuberSizeIdParamSchema, body: updateTuberSizeBodySchema } },
    tuberSizesController.updateTuberSize,
  );

  fastify.delete(
    "/:id",
    { schema: { params: tuberSizeIdParamSchema } },
    tuberSizesController.deleteTuberSize,
  );

  fastify.delete("/all", tuberSizesController.deleteAllTuberSizes);
}
