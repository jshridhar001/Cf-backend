import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateRougingBody,
  FieldIdParam,
  RougingIdParam,
  UpdateRougingBody,
} from "@/features/rouging/rouging.schema.js";
import * as rougingsService from "@/features/rouging/rouging.service.js";

export async function createRougingHandler(
  request: FastifyRequest<{ Body: CreateRougingBody }>,
  reply: FastifyReply,
) {
  const createdById = request.user?.id;
  if (!createdById) {
    return reply.code(401).send({ success: false, message: "Unauthorized" });
  }

  const rouging = await rougingsService.createRouging(request.body, createdById);
  return reply.code(201).send({ success: true, data: rouging });
}

export async function getRougingsByFieldIdHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const rougings = await rougingsService.getRougingsByFieldId(request.params.fieldId);
  return reply.send({ success: true, data: rougings });
}

export async function getRougingByIdHandler(
  request: FastifyRequest<{ Params: RougingIdParam }>,
  reply: FastifyReply,
) {
  const rouging = await rougingsService.getRougingById(request.params.id);
  if (!rouging) {
    return reply.code(404).send({ success: false, message: "Rouging record not found" });
  }
  return reply.send({ success: true, data: rouging });
}

export async function updateRougingHandler(
  request: FastifyRequest<{ Params: RougingIdParam; Body: UpdateRougingBody }>,
  reply: FastifyReply,
) {
  const rouging = await rougingsService.updateRouging(request.params.id, request.body);
  if (!rouging) {
    return reply.code(404).send({ success: false, message: "Rouging record not found" });
  }
  return reply.send({ success: true, data: rouging });
}

export async function deleteRougingHandler(
  request: FastifyRequest<{ Params: RougingIdParam }>,
  reply: FastifyReply,
) {
  const rouging = await rougingsService.deleteRouging(request.params.id);
  if (!rouging) {
    return reply.code(404).send({ success: false, message: "Rouging record not found" });
  }
  return reply.send({ success: true, message: "Rouging deleted successfully" });
}

export async function deleteAllRougingsForFieldHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const deletedRecords = await rougingsService.deleteAllRougingsForField(request.params.fieldId);
  return reply.send({
    success: true,
    message: `Successfully deleted ${deletedRecords.length} rouging records for this field.`,
    count: deletedRecords.length,
  });
}
