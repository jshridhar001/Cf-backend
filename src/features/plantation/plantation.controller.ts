import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreatePlantationBody,
  FieldIdParam,
  PlantationIdParam,
  UpdatePlantationBody,
} from "@/features/plantation/plantation.schema.js";
import * as plantationsService from "@/features/plantation/plantation.service.js";

export async function createPlantationHandler(
  request: FastifyRequest<{ Body: CreatePlantationBody }>,
  reply: FastifyReply,
) {
  const createdById = request.user?.id;
  if (!createdById) {
    return reply.code(401).send({ success: false, message: "Unauthorized" });
  }

  const plantation = await plantationsService.createPlantation(request.body, createdById);
  return reply.code(201).send({ success: true, data: plantation });
}

export async function getPlantationsByFieldIdHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const plantations = await plantationsService.getPlantationsByFieldId(request.params.fieldId);
  return reply.send({ success: true, data: plantations });
}

export async function getPlantationByIdHandler(
  request: FastifyRequest<{ Params: PlantationIdParam }>,
  reply: FastifyReply,
) {
  const plantation = await plantationsService.getPlantationById(request.params.id);
  if (!plantation) {
    return reply.code(404).send({ success: false, message: "Plantation record not found" });
  }
  return reply.send({ success: true, data: plantation });
}

export async function updatePlantationHandler(
  request: FastifyRequest<{ Params: PlantationIdParam; Body: UpdatePlantationBody }>,
  reply: FastifyReply,
) {
  const plantation = await plantationsService.updatePlantation(request.params.id, request.body);
  if (!plantation) {
    return reply.code(404).send({ success: false, message: "Plantation record not found" });
  }
  return reply.send({ success: true, data: plantation });
}

export async function deletePlantationHandler(
  request: FastifyRequest<{ Params: PlantationIdParam }>,
  reply: FastifyReply,
) {
  const plantation = await plantationsService.deletePlantation(request.params.id);
  if (!plantation) {
    return reply.code(404).send({ success: false, message: "Plantation record not found" });
  }
  return reply.send({ success: true, message: "Plantation deleted successfully" });
}

export async function deleteAllPlantationsForFieldHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const deletedRecords = await plantationsService.deleteAllPlantationsForField(
    request.params.fieldId,
  );
  return reply.send({
    success: true,
    message: `Successfully deleted ${deletedRecords.length} plantation records for this field.`,
    count: deletedRecords.length,
  });
}
