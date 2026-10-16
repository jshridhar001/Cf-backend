import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as coldStorageGatePassController from "@/features/cold-storage-gate-pass/cold-storage-gate-pass.controller.js";
import {
  coldStorageGatePassIdParamSchema,
  createColdStorageGatePassBodySchema,
  updateColdStorageGatePassBodySchema,
} from "@/features/cold-storage-gate-pass/cold-storage-gate-pass.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const coldStorageGatePassRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/", coldStorageGatePassController.getAllGatePasses);

  fastify.post(
    "/",
    { schema: { body: createColdStorageGatePassBodySchema } },
    coldStorageGatePassController.createGatePass,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        params: coldStorageGatePassIdParamSchema,
        body: updateColdStorageGatePassBodySchema,
      },
    },
    coldStorageGatePassController.updateGatePass,
  );

  fastify.patch(
    "/:id/nullify",
    { schema: { params: coldStorageGatePassIdParamSchema } },
    coldStorageGatePassController.nullifyGatePass,
  );

  fastify.delete(
    "/:id",
    { schema: { params: coldStorageGatePassIdParamSchema } },
    coldStorageGatePassController.deleteGatePass,
  );

  fastify.get(
    "/:id",
    { schema: { params: coldStorageGatePassIdParamSchema } },
    coldStorageGatePassController.getGatePassById,
  );
};
