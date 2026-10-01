import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  ConfirmLotReceiptBody,
  LotIdParam,
} from "@/features/seed-dispatch/lot-receipt.schema.js";
import {
  confirmLotReceipt,
  sendLotReceiptOtp,
} from "@/features/seed-dispatch/lot-receipt.service.js";

function sendLotError(
  reply: FastifyReply,
  error:
    | "not_found"
    | "already_received"
    | "not_in_transit"
    | "no_mobile"
    | "cooldown"
    | "invalid_otp",
  message: string,
) {
  if (error === "not_found") {
    return reply.code(404).send({
      success: false,
      error: { code: "NOT_FOUND", message },
    });
  }

  if (error === "cooldown") {
    return reply.code(429).send({
      success: false,
      error: { code: "TOO_MANY_REQUESTS", message },
    });
  }

  if (error === "already_received" || error === "not_in_transit") {
    return reply.code(409).send({
      success: false,
      error: { code: "CONFLICT", message },
    });
  }

  return reply.code(400).send({
    success: false,
    error: { code: "BAD_REQUEST", message },
  });
}

export async function sendOtp(
  request: FastifyRequest<{ Params: LotIdParam }>,
  reply: FastifyReply,
) {
  const result = await sendLotReceiptOtp(request.params.lotId);
  if (result.error) {
    return sendLotError(reply, result.error, result.message);
  }
  return reply.send({ success: true, data: result.data });
}

export async function confirmReceipt(
  request: FastifyRequest<{ Params: LotIdParam; Body: ConfirmLotReceiptBody }>,
  reply: FastifyReply,
) {
  const userId = request.user?.id;
  if (!userId) {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  const result = await confirmLotReceipt(request.params.lotId, request.body.otp, userId);
  if (result.error) {
    return sendLotError(reply, result.error, result.message);
  }
  return reply.send({ success: true, data: result.data });
}
