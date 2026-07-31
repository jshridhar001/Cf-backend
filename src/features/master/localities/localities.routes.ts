import type { FastifyInstance } from "fastify";
import * as localitiesController from "@/features/master/localities/localities.controller.js";
import {
  createLocalityBodySchema,
  localityIdParamSchema,
  updateLocalityBodySchema,
} from "@/features/master/localities/localities.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function localityRoutes(fastify: FastifyInstance) {
  // 🛡️ Apply Head Office protection to ALL routes in this plugin
  fastify.addHook("preHandler", requireHeadOffice);

  fastify.get("/", localitiesController.getAllLocalities);

  fastify.get(
    "/:id",
    { schema: { params: localityIdParamSchema } },
    localitiesController.getLocalityById,
  );

  fastify.post(
    "/",
    { schema: { body: createLocalityBodySchema } },
    localitiesController.createLocality,
  );

  fastify.put(
    "/:id",
    { schema: { params: localityIdParamSchema, body: updateLocalityBodySchema } },
    localitiesController.updateLocality,
  );

  fastify.delete(
    "/:id",
    { schema: { params: localityIdParamSchema } },
    localitiesController.deleteLocality,
  );

  fastify.delete("/all", localitiesController.deleteAllLocalities);
}
