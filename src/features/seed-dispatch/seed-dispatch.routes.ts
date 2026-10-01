import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as lotReceiptController from "@/features/seed-dispatch/lot-receipt.controller.js";
import {
  confirmLotReceiptBodySchema,
  lotIdParamSchema,
} from "@/features/seed-dispatch/lot-receipt.schema.js";
import * as seedDispatchesController from "@/features/seed-dispatch/seed-dispatch.controller.js";
import {
  createDispatchBodySchema,
  dispatchIdParamSchema,
  updateDispatchStatusBodySchema,
} from "@/features/seed-dispatch/seed-dispatch.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const seedDispatchRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/", seedDispatchesController.getAllDispatches);

  fastify.post(
    "/",
    { schema: { body: createDispatchBodySchema } },
    seedDispatchesController.createDispatch,
  );

  fastify.patch(
    "/:id/nullify",
    { schema: { params: dispatchIdParamSchema } },
    seedDispatchesController.markDispatchAsNull,
  );

  fastify.patch(
    "/:id/status",
    {
      schema: {
        params: dispatchIdParamSchema,
        body: updateDispatchStatusBodySchema,
      },
    },
    seedDispatchesController.updateDispatchStatus,
  );

  fastify.post(
    "/:lotId/otp",
    { schema: { params: lotIdParamSchema } },
    lotReceiptController.sendOtp,
  );

  fastify.post(
    "/:lotId/confirm",
    {
      schema: {
        params: lotIdParamSchema,
        body: confirmLotReceiptBodySchema,
      },
    },
    lotReceiptController.confirmReceipt,
  );

  fastify.get(
    "/:id",
    { schema: { params: dispatchIdParamSchema } },
    seedDispatchesController.getDispatchById,
  );
};
