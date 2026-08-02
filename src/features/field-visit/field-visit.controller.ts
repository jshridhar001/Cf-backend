import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateFieldVisitBody,
  FieldIdParam,
  FieldVisitIdParam,
  UpdateFieldVisitBody,
} from "@/features/field-visit/field-visit.schema.js";
import * as fieldVisitService from "@/features/field-visit/field-visit.service.js";

export async function createFieldVisitHandler(
  request: FastifyRequest<{ Body: CreateFieldVisitBody }>,
  reply: FastifyReply,
) {
  const createdById = request.user?.id;
  if (!createdById) {
    return reply.code(401).send({ success: false, message: "Unauthorized" });
  }

  const visit = await fieldVisitService.createFieldVisit(request.body, createdById);
  return reply.code(201).send({ success: true, data: visit });
}

export async function getFieldVisitsByFieldIdHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const visits = await fieldVisitService.getFieldVisitsByFieldId(request.params.fieldId);
  return reply.send({ success: true, data: visits });
}

export async function getFieldVisitByIdHandler(
  request: FastifyRequest<{ Params: FieldVisitIdParam }>,
  reply: FastifyReply,
) {
  const visit = await fieldVisitService.getFieldVisitById(request.params.id);
  if (!visit) {
    return reply.code(404).send({ success: false, message: "Field visit record not found" });
  }
  return reply.send({ success: true, data: visit });
}

export async function updateFieldVisitHandler(
  request: FastifyRequest<{ Params: FieldVisitIdParam; Body: UpdateFieldVisitBody }>,
  reply: FastifyReply,
) {
  const visit = await fieldVisitService.updateFieldVisit(request.params.id, request.body);
  if (!visit) {
    return reply.code(404).send({ success: false, message: "Field visit record not found" });
  }
  return reply.send({ success: true, data: visit });
}

export async function deleteFieldVisitHandler(
  request: FastifyRequest<{ Params: FieldVisitIdParam }>,
  reply: FastifyReply,
) {
  const visit = await fieldVisitService.deleteFieldVisit(request.params.id);
  if (!visit) {
    return reply.code(404).send({ success: false, message: "Field visit record not found" });
  }
  return reply.send({ success: true, message: "Field visit deleted successfully" });
}

export async function deleteAllFieldVisitsForFieldHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const deletedRecords = await fieldVisitService.deleteAllFieldVisitsForField(
    request.params.fieldId,
  );
  return reply.send({
    success: true,
    message: `Successfully deleted ${deletedRecords.length} field visit records for this field.`,
    count: deletedRecords.length,
  });
}
