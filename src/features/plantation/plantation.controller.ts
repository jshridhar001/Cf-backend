import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreatePlantationBody,
  ListPlantationQuery,
  PlantationIdParam,
  UpdatePlantationBody,
} from "@/features/plantation/plantation.schema.js";
import {
  PlantationWriteError,
  plantationsService,
} from "@/features/plantation/plantation.service.js";
import { isForeignKeyViolation } from "@/lib/postgres-errors.js";

const INVALID_REFERENCE = "Invalid field, variety, seed size, or requisition.";

function sendPlantationWriteError(error: unknown, reply: FastifyReply) {
  if (error instanceof PlantationWriteError) {
    return reply.status(400).send({ success: false, error: error.message });
  }
  if (isForeignKeyViolation(error)) {
    return reply.status(400).send({ success: false, error: INVALID_REFERENCE });
  }
  throw error;
}

export async function getAllPlantations(
  request: FastifyRequest<{ Querystring: ListPlantationQuery }>,
  reply: FastifyReply,
) {
  const data = await plantationsService.getAllPlantations(request.query.fieldId);
  return reply.send({ success: true, data });
}

export async function getPlantationById(
  request: FastifyRequest<{ Params: PlantationIdParam }>,
  reply: FastifyReply,
) {
  const data = await plantationsService.getPlantationById(request.params.id);

  if (!data) {
    return reply.status(404).send({ success: false, error: "Plantation not found." });
  }

  return reply.send({ success: true, data });
}

export async function createPlantation(
  request: FastifyRequest<{ Body: CreatePlantationBody }>,
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
    const plantation = await plantationsService.createPlantation(request.body, createdById);
    return reply.status(201).send({ success: true, data: plantation });
  } catch (error) {
    return sendPlantationWriteError(error, reply);
  }
}

export async function updatePlantation(
  request: FastifyRequest<{ Params: PlantationIdParam; Body: UpdatePlantationBody }>,
  reply: FastifyReply,
) {
  try {
    const plantation = await plantationsService.updatePlantation(request.params.id, request.body);

    if (!plantation) {
      return reply.status(404).send({ success: false, error: "Plantation not found." });
    }

    return reply.send({ success: true, data: plantation });
  } catch (error) {
    return sendPlantationWriteError(error, reply);
  }
}

export async function deletePlantation(
  request: FastifyRequest<{ Params: PlantationIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await plantationsService.deletePlantation(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Plantation not found." });
  }

  return reply.send({ success: true, message: "Plantation deleted successfully." });
}
