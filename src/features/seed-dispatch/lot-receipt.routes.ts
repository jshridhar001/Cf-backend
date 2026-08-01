import type { FastifyInstance } from "fastify";
import { lotReceiptController } from "@/features/seed-dispatch/lot-receipt.controller.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function lotReceiptRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/:lotId/otp", lotReceiptController.sendOtp);
  fastify.post("/:lotId/confirm", lotReceiptController.confirmReceipt);
}
