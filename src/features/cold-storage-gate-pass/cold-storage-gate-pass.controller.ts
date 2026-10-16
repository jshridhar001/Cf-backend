import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  ColdStorageGatePassIdParam,
  CreateColdStorageGatePassBody,
  UpdateColdStorageGatePassBody,
} from "@/features/cold-storage-gate-pass/cold-storage-gate-pass.schema.js";
import {
  ColdStorageGatePassCrudError,
  coldStorageGatePassService,
} from "@/features/cold-storage-gate-pass/cold-storage-gate-pass.service.js";
import { isForeignKeyViolation } from "@/lib/postgres-errors.js";

export async function getAllGatePasses(_request: FastifyRequest, reply: FastifyReply) {
  const data = await coldStorageGatePassService.getAllGatePasses();
  return reply.send({ success: true, data });
}

export async function getGatePassById(
  request: FastifyRequest<{ Params: ColdStorageGatePassIdParam }>,
  reply: FastifyReply,
) {
  const data = await coldStorageGatePassService.getGatePassById(request.params.id);

  if (!data) {
    return reply.status(404).send({ success: false, error: "Cold storage gate pass not found." });
  }

  return reply.send({ success: true, data });
}

export async function createGatePass(
  request: FastifyRequest<{ Body: CreateColdStorageGatePassBody }>,
  reply: FastifyReply,
) {
  try {
    const created = await coldStorageGatePassService.createGatePass(request.body);
    return reply.status(201).send({ success: true, data: created });
  } catch (error) {
    if (error instanceof ColdStorageGatePassCrudError) {
      return reply.status(error.statusCode).send({ success: false, error: error.message });
    }
    if (isForeignKeyViolation(error)) {
      return reply.status(400).send({
        success: false,
        error: "Invalid facility, variety, generation, or seed size.",
      });
    }
    throw error;
  }
}

export async function updateGatePass(
  request: FastifyRequest<{
    Params: ColdStorageGatePassIdParam;
    Body: UpdateColdStorageGatePassBody;
  }>,
  reply: FastifyReply,
) {
  try {
    const updated = await coldStorageGatePassService.updateGatePass(
      request.params.id,
      request.body,
    );

    if (!updated) {
      return reply.status(404).send({ success: false, error: "Cold storage gate pass not found." });
    }

    return reply.send({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ColdStorageGatePassCrudError) {
      return reply.status(error.statusCode).send({ success: false, error: error.message });
    }
    if (isForeignKeyViolation(error)) {
      return reply.status(400).send({
        success: false,
        error: "Invalid facility, variety, generation, or seed size.",
      });
    }
    throw error;
  }
}

export async function nullifyGatePass(
  request: FastifyRequest<{ Params: ColdStorageGatePassIdParam }>,
  reply: FastifyReply,
) {
  try {
    const updated = await coldStorageGatePassService.nullifyGatePass(request.params.id);

    if (!updated) {
      return reply.status(404).send({ success: false, error: "Cold storage gate pass not found." });
    }

    return reply.send({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ColdStorageGatePassCrudError) {
      return reply.status(error.statusCode).send({ success: false, error: error.message });
    }
    throw error;
  }
}

export async function deleteGatePass(
  request: FastifyRequest<{ Params: ColdStorageGatePassIdParam }>,
  reply: FastifyReply,
) {
  try {
    const deleted = await coldStorageGatePassService.deleteGatePass(request.params.id);

    if (!deleted) {
      return reply.status(404).send({ success: false, error: "Cold storage gate pass not found." });
    }

    return reply.send({ success: true, message: "Cold storage gate pass deleted successfully." });
  } catch (error) {
    if (error instanceof ColdStorageGatePassCrudError) {
      return reply.status(error.statusCode).send({ success: false, error: error.message });
    }
    throw error;
  }
}
