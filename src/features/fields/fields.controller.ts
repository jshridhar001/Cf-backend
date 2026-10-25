import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateFieldBody,
  FieldIdParam,
  UpdateFieldBody,
} from "@/features/fields/fields.schema.js";
import { fieldsService } from "@/features/fields/fields.service.js";
import {
  isForeignKeyViolation,
  isUniqueViolation,
  postgresConstraint,
} from "@/lib/postgres-errors.js";

function duplicateFieldMessage(constraint: string | undefined) {
  if (constraint === "unique_field_name_per_farmer") {
    return "A field with this name already exists for this farmer.";
  }
  return "A field with these details already exists.";
}

function sendFieldWriteError(error: unknown, reply: FastifyReply) {
  if (isUniqueViolation(error)) {
    return reply.status(409).send({
      success: false,
      error: duplicateFieldMessage(postgresConstraint(error)),
    });
  }
  if (isForeignKeyViolation(error)) {
    return reply.status(400).send({
      success: false,
      error: "Invalid farmer or assigned officer.",
    });
  }
  throw error;
}

export async function getAllFields(_request: FastifyRequest, reply: FastifyReply) {
  const data = await fieldsService.getAllFields();
  return reply.send({ success: true, data });
}

export async function getFieldById(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const data = await fieldsService.getFieldById(request.params.id);

  if (!data) {
    return reply.status(404).send({ success: false, error: "Field not found." });
  }

  return reply.send({ success: true, data });
}

export async function createField(
  request: FastifyRequest<{ Body: CreateFieldBody }>,
  reply: FastifyReply,
) {
  try {
    const field = await fieldsService.createField(request.body);
    return reply.status(201).send({ success: true, data: field });
  } catch (error) {
    return sendFieldWriteError(error, reply);
  }
}

export async function updateField(
  request: FastifyRequest<{ Params: FieldIdParam; Body: UpdateFieldBody }>,
  reply: FastifyReply,
) {
  try {
    const field = await fieldsService.updateField(request.params.id, request.body);

    if (!field) {
      return reply.status(404).send({ success: false, error: "Field not found." });
    }

    return reply.send({ success: true, data: field });
  } catch (error) {
    return sendFieldWriteError(error, reply);
  }
}

export async function deleteField(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  try {
    const deleted = await fieldsService.deleteField(request.params.id);

    if (!deleted) {
      return reply.status(404).send({ success: false, error: "Field not found." });
    }

    return reply.send({ success: true, message: "Field deleted successfully." });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return reply.status(409).send({
        success: false,
        error: "This field is still in use and cannot be deleted.",
      });
    }
    throw error;
  }
}
