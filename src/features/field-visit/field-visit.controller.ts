import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateFieldVisitBody,
  FieldVisitIdParam,
  ListFieldVisitQuery,
  UpdateFieldVisitBody,
} from "@/features/field-visit/field-visit.schema.js";
import {
  FieldVisitWriteError,
  fieldVisitsService,
} from "@/features/field-visit/field-visit.service.js";
import { isForeignKeyViolation } from "@/lib/postgres-errors.js";

const INVALID_REFERENCE = "Invalid field or user.";

function sendFieldVisitWriteError(error: unknown, reply: FastifyReply) {
  if (error instanceof FieldVisitWriteError) {
    return reply.status(400).send({ success: false, error: error.message });
  }
  if (isForeignKeyViolation(error)) {
    return reply.status(400).send({ success: false, error: INVALID_REFERENCE });
  }
  throw error;
}

export async function getAllFieldVisits(
  request: FastifyRequest<{ Querystring: ListFieldVisitQuery }>,
  reply: FastifyReply,
) {
  const data = await fieldVisitsService.getAllFieldVisits(request.query.fieldId);
  return reply.send({ success: true, data });
}

export async function getFieldVisitById(
  request: FastifyRequest<{ Params: FieldVisitIdParam }>,
  reply: FastifyReply,
) {
  const data = await fieldVisitsService.getFieldVisitById(request.params.id);

  if (!data) {
    return reply.status(404).send({ success: false, error: "Field visit not found." });
  }

  return reply.send({ success: true, data });
}

export async function createFieldVisit(
  request: FastifyRequest<{ Body: CreateFieldVisitBody }>,
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
    const fieldVisit = await fieldVisitsService.createFieldVisit(request.body, createdById);
    return reply.status(201).send({ success: true, data: fieldVisit });
  } catch (error) {
    return sendFieldVisitWriteError(error, reply);
  }
}

export async function updateFieldVisit(
  request: FastifyRequest<{ Params: FieldVisitIdParam; Body: UpdateFieldVisitBody }>,
  reply: FastifyReply,
) {
  try {
    const fieldVisit = await fieldVisitsService.updateFieldVisit(request.params.id, request.body);

    if (!fieldVisit) {
      return reply.status(404).send({ success: false, error: "Field visit not found." });
    }

    return reply.send({ success: true, data: fieldVisit });
  } catch (error) {
    return sendFieldVisitWriteError(error, reply);
  }
}

export async function deleteFieldVisit(
  request: FastifyRequest<{ Params: FieldVisitIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await fieldVisitsService.deleteFieldVisit(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Field visit not found." });
  }

  return reply.send({ success: true, message: "Field visit deleted successfully." });
}
