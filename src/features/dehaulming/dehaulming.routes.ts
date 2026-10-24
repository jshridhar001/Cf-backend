import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as dehaulmingController from "@/features/dehaulming/dehaulming.controller.js";
import {
  createDehaulmingBodySchema,
  dehaulmingIdParamSchema,
  listDehaulmingQuerySchema,
  updateDehaulmingBodySchema,
} from "@/features/dehaulming/dehaulming.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const dehaulmingRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get(
    "/",
    { schema: { querystring: listDehaulmingQuerySchema } },
    dehaulmingController.getAllDehaulmings,
  );

  fastify.get(
    "/:id",
    { schema: { params: dehaulmingIdParamSchema } },
    dehaulmingController.getDehaulmingById,
  );

  fastify.post(
    "/",
    { schema: { body: createDehaulmingBodySchema } },
    dehaulmingController.createDehaulming,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        params: dehaulmingIdParamSchema,
        body: updateDehaulmingBodySchema,
      },
    },
    dehaulmingController.updateDehaulming,
  );

  fastify.delete(
    "/:id",
    { schema: { params: dehaulmingIdParamSchema } },
    dehaulmingController.deleteDehaulming,
  );
};
