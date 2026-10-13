import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateStockTransferBody,
  StockTransferIdParam,
} from "@/features/stock-transfer/stock-transfer.schema.js";
import { stockTransfersService } from "@/features/stock-transfer/stock-transfer.service.js";
import { isForeignKeyViolation } from "@/lib/postgres-errors.js";

export async function getAllTransfers(_request: FastifyRequest, reply: FastifyReply) {
  const data = await stockTransfersService.getAllTransfers();
  return reply.send({ success: true, data });
}

export async function getTransferById(
  request: FastifyRequest<{ Params: StockTransferIdParam }>,
  reply: FastifyReply,
) {
  const data = await stockTransfersService.getTransferById(request.params.id);

  if (!data) {
    return reply.code(404).send({
      success: false,
      error: { code: "NOT_FOUND", message: "Stock transfer not found" },
    });
  }

  return reply.send({ success: true, data });
}

export async function createTransfer(
  request: FastifyRequest<{ Body: CreateStockTransferBody }>,
  reply: FastifyReply,
) {
  const createdById = request.user?.id;
  if (!createdById) {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  try {
    const result = await stockTransfersService.createTransfer(request.body, createdById);

    if (result.error === "invalid_farmer" || result.error === "invalid_reference") {
      return reply.code(400).send({
        success: false,
        error: { code: "BAD_REQUEST", message: result.message },
      });
    }

    if (result.error) {
      return reply.code(409).send({
        success: false,
        error: { code: "CONFLICT", message: result.message },
      });
    }

    return reply.code(201).send({ success: true, data: result.data });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return reply.code(400).send({
        success: false,
        error: { code: "BAD_REQUEST", message: "Invalid variety, seed size, or generation" },
      });
    }
    throw error;
  }
}

export async function confirmTransfer(
  request: FastifyRequest<{ Params: StockTransferIdParam }>,
  reply: FastifyReply,
) {
  const userId = request.user?.id;
  if (!userId) {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  const result = await stockTransfersService.confirmTransfer(request.params.id, userId);

  if (result.error === "not_found") {
    return reply.code(404).send({
      success: false,
      error: { code: "NOT_FOUND", message: result.message },
    });
  }

  if (result.error) {
    return reply.code(409).send({
      success: false,
      error: { code: "CONFLICT", message: result.message },
    });
  }

  return reply.send({ success: true, data: result.data });
}

export async function nullifyTransfer(
  request: FastifyRequest<{ Params: StockTransferIdParam }>,
  reply: FastifyReply,
) {
  const result = await stockTransfersService.nullifyTransfer(request.params.id);

  if (result.error === "not_found") {
    return reply.code(404).send({
      success: false,
      error: { code: "NOT_FOUND", message: result.message },
    });
  }

  if (result.error) {
    return reply.code(409).send({
      success: false,
      error: { code: "CONFLICT", message: result.message },
    });
  }

  return reply.send({ success: true, data: result.data });
}
