import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateDehaulmingBody,
  DehaulmingIdParam,
  FieldIdParam,
  UpdateDehaulmingBody,
} from "@/features/dehaulming/dehaulming.schema.js";
import * as dehaulmingsService from "@/features/dehaulming/dehaulming.service.js";

export async function createDehaulmingHandler(
  request: FastifyRequest<{ Body: CreateDehaulmingBody }>,
  reply: FastifyReply,
) {
  const createdById = request.user?.id;
  if (!createdById) {
    return reply.code(401).send({ success: false, message: "Unauthorized" });
  }

  const dehaulming = await dehaulmingsService.createDehaulming(request.body, createdById);
  return reply.code(201).send({ success: true, data: dehaulming });
}

export async function getDehaulmingsByFieldIdHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const dehaulmings = await dehaulmingsService.getDehaulmingsByFieldId(request.params.fieldId);
  return reply.send({ success: true, data: dehaulmings });
}

export async function getDehaulmingByIdHandler(
  request: FastifyRequest<{ Params: DehaulmingIdParam }>,
  reply: FastifyReply,
) {
  const dehaulming = await dehaulmingsService.getDehaulmingById(request.params.id);
  if (!dehaulming) {
    return reply.code(404).send({ success: false, message: "Dehaulming record not found" });
  }
  return reply.send({ success: true, data: dehaulming });
}

export async function updateDehaulmingHandler(
  request: FastifyRequest<{ Params: DehaulmingIdParam; Body: UpdateDehaulmingBody }>,
  reply: FastifyReply,
) {
  const dehaulming = await dehaulmingsService.updateDehaulming(request.params.id, request.body);
  if (!dehaulming) {
    return reply.code(404).send({ success: false, message: "Dehaulming record not found" });
  }
  return reply.send({ success: true, data: dehaulming });
}

export async function deleteDehaulmingHandler(
  request: FastifyRequest<{ Params: DehaulmingIdParam }>,
  reply: FastifyReply,
) {
  const dehaulming = await dehaulmingsService.deleteDehaulming(request.params.id);
  if (!dehaulming) {
    return reply.code(404).send({ success: false, message: "Dehaulming record not found" });
  }
  return reply.send({ success: true, message: "Dehaulming deleted successfully" });
}

export async function deleteAllDehaulmingsForFieldHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const deletedRecords = await dehaulmingsService.deleteAllDehaulmingsForField(
    request.params.fieldId,
  );
  return reply.send({
    success: true,
    message: `Successfully deleted ${deletedRecords.length} dehaulming records for this field.`,
    count: deletedRecords.length,
  });
}
