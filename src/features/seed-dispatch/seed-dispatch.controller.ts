import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateDispatchBody,
  DispatchIdParam,
  UpdateDispatchStatusBody,
} from "@/features/seed-dispatch/seed-dispatch.schema.js";
import { seedDispatchesService } from "@/features/seed-dispatch/seed-dispatch.service.js";
import { isForeignKeyViolation } from "@/lib/postgres-errors.js";

export async function getAllDispatches(_request: FastifyRequest, reply: FastifyReply) {
  const data = await seedDispatchesService.getAllDispatches();
  return reply.send({ success: true, data });
}

export async function getDispatchById(
  request: FastifyRequest<{ Params: DispatchIdParam }>,
  reply: FastifyReply,
) {
  const data = await seedDispatchesService.getDispatchById(request.params.id);

  if (!data) {
    return reply.code(404).send({
      success: false,
      error: { code: "NOT_FOUND", message: "Seed dispatch not found" },
    });
  }

  return reply.send({ success: true, data });
}

export async function createDispatch(
  request: FastifyRequest<{ Body: CreateDispatchBody }>,
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
    const result = await seedDispatchesService.createDispatch(request.body, createdById);

    if (result.error === "invalid_requisition") {
      return reply.code(400).send({
        success: false,
        error: { code: "BAD_REQUEST", message: result.message },
      });
    }

    if (result.error === "not_approved") {
      return reply.code(409).send({
        success: false,
        error: { code: "CONFLICT", message: result.message },
      });
    }

    if (result.error === "quantity_exceeded") {
      return reply.code(409).send({
        success: false,
        error: { code: "CONFLICT", message: result.message },
      });
    }

    if (result.error === "invalid_size" || result.error === "invalid_reference") {
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
        error: { code: "BAD_REQUEST", message: "Invalid facility, seed size, or generation" },
      });
    }
    throw error;
  }
}

export async function markDispatchAsNull(
  request: FastifyRequest<{ Params: DispatchIdParam }>,
  reply: FastifyReply,
) {
  const result = await seedDispatchesService.markDispatchAsNull(request.params.id);

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

export async function updateDispatchStatus(
  request: FastifyRequest<{ Params: DispatchIdParam; Body: UpdateDispatchStatusBody }>,
  reply: FastifyReply,
) {
  const result = await seedDispatchesService.updateStatus(request.params.id, request.body);

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
