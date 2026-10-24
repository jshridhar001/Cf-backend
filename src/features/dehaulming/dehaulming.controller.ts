import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateDehaulmingBody,
  DehaulmingIdParam,
  ListDehaulmingQuery,
  UpdateDehaulmingBody,
} from "@/features/dehaulming/dehaulming.schema.js";
import {
  DehaulmingWriteError,
  dehaulmingsService,
} from "@/features/dehaulming/dehaulming.service.js";
import { isForeignKeyViolation } from "@/lib/postgres-errors.js";

const INVALID_REFERENCE = "Invalid field or user.";

function sendDehaulmingWriteError(error: unknown, reply: FastifyReply) {
  if (error instanceof DehaulmingWriteError) {
    return reply.status(400).send({ success: false, error: error.message });
  }
  if (isForeignKeyViolation(error)) {
    return reply.status(400).send({ success: false, error: INVALID_REFERENCE });
  }
  throw error;
}

export async function getAllDehaulmings(
  request: FastifyRequest<{ Querystring: ListDehaulmingQuery }>,
  reply: FastifyReply,
) {
  const data = await dehaulmingsService.getAllDehaulmings(request.query.fieldId);
  return reply.send({ success: true, data });
}

export async function getDehaulmingById(
  request: FastifyRequest<{ Params: DehaulmingIdParam }>,
  reply: FastifyReply,
) {
  const data = await dehaulmingsService.getDehaulmingById(request.params.id);

  if (!data) {
    return reply.status(404).send({ success: false, error: "Dehaulming not found." });
  }

  return reply.send({ success: true, data });
}

export async function createDehaulming(
  request: FastifyRequest<{ Body: CreateDehaulmingBody }>,
  reply: FastifyReply,
) {
  const createdById = request.user?.id;
  if (!createdById) {
    return reply.status(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  try {
    const dehaulming = await dehaulmingsService.createDehaulming(request.body, createdById);
    return reply.status(201).send({ success: true, data: dehaulming });
  } catch (error) {
    return sendDehaulmingWriteError(error, reply);
  }
}

export async function updateDehaulming(
  request: FastifyRequest<{ Params: DehaulmingIdParam; Body: UpdateDehaulmingBody }>,
  reply: FastifyReply,
) {
  try {
    const dehaulming = await dehaulmingsService.updateDehaulming(request.params.id, request.body);

    if (!dehaulming) {
      return reply.status(404).send({ success: false, error: "Dehaulming not found." });
    }

    return reply.send({ success: true, data: dehaulming });
  } catch (error) {
    return sendDehaulmingWriteError(error, reply);
  }
}

export async function deleteDehaulming(
  request: FastifyRequest<{ Params: DehaulmingIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await dehaulmingsService.deleteDehaulming(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Dehaulming not found." });
  }

  return reply.send({ success: true, message: "Dehaulming deleted successfully." });
}
