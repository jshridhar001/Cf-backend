import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateFieldBody,
  FieldIdParam,
  GetFieldsQuery,
  UpdateBoundaryBody,
  UpdateFieldBody,
} from "@/features/fields/fields.schema.js";
import * as fieldsService from "@/features/fields/fields.service.js";

function isUniqueFieldNameViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as {
    code?: string;
    constraint?: string;
    cause?: { code?: string; constraint?: string };
  };
  const code = err.code ?? err.cause?.code;
  const constraint = err.constraint ?? err.cause?.constraint;
  return code === "23505" && constraint === "unique_field_name_per_farmer";
}

export async function createFieldHandler(
  request: FastifyRequest<{ Body: CreateFieldBody }>,
  reply: FastifyReply,
) {
  try {
    const field = await fieldsService.createField(request.body);
    return reply.code(201).send({ success: true, data: field });
  } catch (error: unknown) {
    if (isUniqueFieldNameViolation(error)) {
      return reply.code(409).send({
        success: false,
        message: "This farmer already has a field registered with this name.",
      });
    }
    throw error;
  }
}

export async function getFieldsHandler(
  request: FastifyRequest<{ Querystring: GetFieldsQuery }>,
  reply: FastifyReply,
) {
  const fields = await fieldsService.getFields(request.query);
  return reply.send({ success: true, data: fields });
}

export async function getFieldByIdHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const field = await fieldsService.getFieldById(request.params.id);
  if (!field) {
    return reply.code(404).send({ success: false, message: "Field not found" });
  }
  return reply.send({ success: true, data: field });
}

export async function getFieldActivitiesByIdHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const field = await fieldsService.getFieldActivitiesById(request.params.id);
  if (!field) {
    return reply.code(404).send({ success: false, message: "Field not found" });
  }
  return reply.send({ success: true, data: field });
}

export async function updateFieldHandler(
  request: FastifyRequest<{ Params: FieldIdParam; Body: UpdateFieldBody }>,
  reply: FastifyReply,
) {
  try {
    const field = await fieldsService.updateField(request.params.id, request.body);
    if (!field) {
      return reply.code(404).send({ success: false, message: "Field not found" });
    }
    return reply.send({ success: true, data: field });
  } catch (error: unknown) {
    if (isUniqueFieldNameViolation(error)) {
      return reply.code(409).send({
        success: false,
        message: "This farmer already has a field registered with this name.",
      });
    }
    throw error;
  }
}

export async function updateFieldBoundaryHandler(
  request: FastifyRequest<{ Params: FieldIdParam; Body: UpdateBoundaryBody }>,
  reply: FastifyReply,
) {
  const field = await fieldsService.updateFieldBoundary(
    request.params.id,
    request.body.geoLocation,
  );
  if (!field) {
    return reply.code(404).send({ success: false, message: "Field not found" });
  }
  return reply.send({ success: true, data: field });
}

export async function deleteFieldHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const field = await fieldsService.deleteField(request.params.id);
  if (!field) {
    return reply.code(404).send({ success: false, message: "Field not found" });
  }
  return reply.send({ success: true, message: "Field deleted successfully" });
}
