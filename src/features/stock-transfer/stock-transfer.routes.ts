import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as stockTransfersController from "@/features/stock-transfer/stock-transfer.controller.js";
import {
  createStockTransferBodySchema,
  stockTransferIdParamSchema,
} from "@/features/stock-transfer/stock-transfer.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const stockTransferRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/", stockTransfersController.getAllTransfers);

  fastify.post(
    "/",
    { schema: { body: createStockTransferBodySchema } },
    stockTransfersController.createTransfer,
  );

  fastify.patch(
    "/:id/nullify",
    { schema: { params: stockTransferIdParamSchema } },
    stockTransfersController.nullifyTransfer,
  );

  fastify.post(
    "/:id/confirm",
    { schema: { params: stockTransferIdParamSchema } },
    stockTransfersController.confirmTransfer,
  );

  fastify.get(
    "/:id",
    { schema: { params: stockTransferIdParamSchema } },
    stockTransfersController.getTransferById,
  );
};
