import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateRougingBody,
  ListRougingQuery,
  RougingIdParam,
  UpdateRougingBody,
} from "@/features/rouging/rouging.schema.js";
import { RougingWriteError, rougingsService } from "@/features/rouging/rouging.service.js";
import { isForeignKeyViolation } from "@/lib/postgres-errors.js";

const INVALID_REFERENCE = "Invalid field or user.";

function sendRougingWriteError(error: unknown, reply: FastifyReply) {
  if (error instanceof RougingWriteError) {
    return reply.status(400).send({ success: false, error: error.message });
  }
  if (isForeignKeyViolation(error)) {
    return reply.status(400).send({ success: false, error: INVALID_REFERENCE });
  }
  throw error;
}

export async function getAllRougings(
  request: FastifyRequest<{ Querystring: ListRougingQuery }>,
  reply: FastifyReply,
) {
  const data = await rougingsService.getAllRougings(request.query.fieldId);
  return reply.send({ success: true, data });
}

export async function getRougingById(
  request: FastifyRequest<{ Params: RougingIdParam }>,
  reply: FastifyReply,
) {
  const data = await rougingsService.getRougingById(request.params.id);

  if (!data) {
    return reply.status(404).send({ success: false, error: "Rouging not found." });
  }

  return reply.send({ success: true, data });
}

export async function createRouging(
  request: FastifyRequest<{ Body: CreateRougingBody }>,
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
    const rouging = await rougingsService.createRouging(request.body, createdById);
    return reply.status(201).send({ success: true, data: rouging });
  } catch (error) {
    return sendRougingWriteError(error, reply);
  }
}

export async function updateRouging(
  request: FastifyRequest<{ Params: RougingIdParam; Body: UpdateRougingBody }>,
  reply: FastifyReply,
) {
  try {
    const rouging = await rougingsService.updateRouging(request.params.id, request.body);

    if (!rouging) {
      return reply.status(404).send({ success: false, error: "Rouging not found." });
    }

    return reply.send({ success: true, data: rouging });
  } catch (error) {
    return sendRougingWriteError(error, reply);
  }
}

export async function deleteRouging(
  request: FastifyRequest<{ Params: RougingIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await rougingsService.deleteRouging(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Rouging not found." });
  }

  return reply.send({ success: true, message: "Rouging deleted successfully." });
}
