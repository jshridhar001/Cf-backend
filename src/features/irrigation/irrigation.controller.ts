import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateIrrigationBody,
  IrrigationIdParam,
  ListIrrigationQuery,
  UpdateIrrigationBody,
} from "@/features/irrigation/irrigation.schema.js";
import {
  IrrigationWriteError,
  irrigationsService,
} from "@/features/irrigation/irrigation.service.js";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/postgres-errors.js";

const INVALID_REFERENCE = "Invalid field or user.";
const DUPLICATE_CYCLE = "An irrigation with this cycle number already exists for this field.";

function sendIrrigationWriteError(error: unknown, reply: FastifyReply) {
  if (error instanceof IrrigationWriteError) {
    return reply.status(400).send({ success: false, error: error.message });
  }
  if (isUniqueViolation(error)) {
    return reply.status(400).send({ success: false, error: DUPLICATE_CYCLE });
  }
  if (isForeignKeyViolation(error)) {
    return reply.status(400).send({ success: false, error: INVALID_REFERENCE });
  }
  throw error;
}

export async function getAllIrrigations(
  request: FastifyRequest<{ Querystring: ListIrrigationQuery }>,
  reply: FastifyReply,
) {
  const data = await irrigationsService.getAllIrrigations(request.query.fieldId);
  return reply.send({ success: true, data });
}

export async function getIrrigationById(
  request: FastifyRequest<{ Params: IrrigationIdParam }>,
  reply: FastifyReply,
) {
  const data = await irrigationsService.getIrrigationById(request.params.id);

  if (!data) {
    return reply.status(404).send({ success: false, error: "Irrigation not found." });
  }

  return reply.send({ success: true, data });
}

export async function createIrrigation(
  request: FastifyRequest<{ Body: CreateIrrigationBody }>,
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
    const irrigation = await irrigationsService.createIrrigation(request.body, createdById);
    return reply.status(201).send({ success: true, data: irrigation });
  } catch (error) {
    return sendIrrigationWriteError(error, reply);
  }
}

export async function updateIrrigation(
  request: FastifyRequest<{ Params: IrrigationIdParam; Body: UpdateIrrigationBody }>,
  reply: FastifyReply,
) {
  try {
    const irrigation = await irrigationsService.updateIrrigation(request.params.id, request.body);

    if (!irrigation) {
      return reply.status(404).send({ success: false, error: "Irrigation not found." });
    }

    return reply.send({ success: true, data: irrigation });
  } catch (error) {
    return sendIrrigationWriteError(error, reply);
  }
}

export async function deleteIrrigation(
  request: FastifyRequest<{ Params: IrrigationIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await irrigationsService.deleteIrrigation(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Irrigation not found." });
  }

  return reply.send({ success: true, message: "Irrigation deleted successfully." });
}
