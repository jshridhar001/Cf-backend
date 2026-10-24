import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as fieldVisitController from "@/features/field-visit/field-visit.controller.js";
import {
  createFieldVisitBodySchema,
  fieldVisitIdParamSchema,
  listFieldVisitQuerySchema,
  updateFieldVisitBodySchema,
} from "@/features/field-visit/field-visit.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const fieldVisitRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get(
    "/",
    { schema: { querystring: listFieldVisitQuerySchema } },
    fieldVisitController.getAllFieldVisits,
  );

  fastify.get(
    "/:id",
    { schema: { params: fieldVisitIdParamSchema } },
    fieldVisitController.getFieldVisitById,
  );

  fastify.post(
    "/",
    { schema: { body: createFieldVisitBodySchema } },
    fieldVisitController.createFieldVisit,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        params: fieldVisitIdParamSchema,
        body: updateFieldVisitBodySchema,
      },
    },
    fieldVisitController.updateFieldVisit,
  );

  fastify.delete(
    "/:id",
    { schema: { params: fieldVisitIdParamSchema } },
    fieldVisitController.deleteFieldVisit,
  );
};
