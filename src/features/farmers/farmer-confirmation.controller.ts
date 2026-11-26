import type { FastifyReply, FastifyRequest } from "fastify";
import type { FarmerIdParam } from "@/features/farmers/farmer.schema.js";
import type { ConfirmFarmerOtpBody } from "@/features/farmers/farmer-confirmation.schema.js";
import {
  type FarmerConfirmationErrorCode,
  getFarmerConfirmation,
  sendFarmerConfirmationOtp,
  verifyFarmerConfirmationOtp,
} from "@/features/farmers/farmer-confirmation.service.js";

function sendConfirmationError(
  reply: FastifyReply,
  error: FarmerConfirmationErrorCode,
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

  if (error === "ineligible") {
    return reply.code(409).send({
      success: false,
      error: { code: "CONFLICT", message },
    });
  }

  if (error === "not_configured") {
    return reply.code(503).send({
      success: false,
      error: { code: "SERVICE_UNAVAILABLE", message },
    });
  }

  if (error === "provider_error") {
    return reply.code(502).send({
      success: false,
      error: { code: "BAD_GATEWAY", message },
    });
  }

  return reply.code(400).send({
    success: false,
    error: { code: "BAD_REQUEST", message },
  });
}

export async function getConfirmation(
  request: FastifyRequest<{ Params: FarmerIdParam }>,
  reply: FastifyReply,
) {
  const result = await getFarmerConfirmation(request.params.id);
  if (result.error) {
    return sendConfirmationError(reply, result.error, result.message);
  }
  return reply.send({ success: true, data: result.data });
}

export async function sendOtp(
  request: FastifyRequest<{ Params: FarmerIdParam }>,
  reply: FastifyReply,
) {
  const result = await sendFarmerConfirmationOtp(request.params.id);
  if (result.error) {
    return sendConfirmationError(reply, result.error, result.message);
  }
  return reply.send({ success: true, data: result.data });
}

export async function verifyOtp(
  request: FastifyRequest<{ Params: FarmerIdParam; Body: ConfirmFarmerOtpBody }>,
  reply: FastifyReply,
) {
  const userId = request.user?.id;
  if (!userId) {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  const result = await verifyFarmerConfirmationOtp(request.params.id, request.body.otp, userId);
  if (result.error) {
    return sendConfirmationError(reply, result.error, result.message);
  }
  return reply.send({ success: true, data: result.data });
}
