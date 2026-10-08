import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { googleDriveRoutes } from "@/features/seed-requisition/google-drive/google-drive.routes.js";
import * as seedRequisitionsController from "@/features/seed-requisition/seed-requisition.controller.js";
import {
  createSeedRequisitionBodySchema,
  decideSeedRequisitionBodySchema,
  seedRequisitionIdParamSchema,
  updateSeedRequisitionBodySchema,
} from "@/features/seed-requisition/seed-requisition.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";
import { requireSeedRequisitionDecision } from "@/middleware/require-seed-requisition-decision.js";

export const seedRequisitionRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  await fastify.register(googleDriveRoutes);

  fastify.get("/", seedRequisitionsController.getAllSeedRequisitions);

  fastify.get(
    "/:id",
    { schema: { params: seedRequisitionIdParamSchema } },
    seedRequisitionsController.getSeedRequisitionById,
  );

  fastify.post(
    "/",
    { schema: { body: createSeedRequisitionBodySchema } },
    seedRequisitionsController.createSeedRequisition,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        params: seedRequisitionIdParamSchema,
        body: updateSeedRequisitionBodySchema,
      },
    },
    seedRequisitionsController.updateSeedRequisition,
  );

  fastify.patch(
    "/:id/decision",
    {
      preHandler: requireSeedRequisitionDecision,
      schema: {
        params: seedRequisitionIdParamSchema,
        body: decideSeedRequisitionBodySchema,
      },
    },
    seedRequisitionsController.decideSeedRequisition,
  );

  fastify.delete("/all", seedRequisitionsController.deleteAllSeedRequisitions);

  fastify.delete(
    "/:id",
    { schema: { params: seedRequisitionIdParamSchema } },
    seedRequisitionsController.deleteSeedRequisition,
  );
};
