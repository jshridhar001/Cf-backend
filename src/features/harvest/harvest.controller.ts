import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateHarvestBody,
  FieldIdParam,
  HarvestIdParam,
  UpdateHarvestBody,
} from "@/features/harvest/harvest.schema.js";
import * as harvestService from "@/features/harvest/harvest.service.js";

export async function createHarvestHandler(
  request: FastifyRequest<{ Body: CreateHarvestBody }>,
  reply: FastifyReply,
) {
  const createdById = request.user?.id;
  if (!createdById) {
    return reply.code(401).send({ success: false, message: "Unauthorized" });
  }

  const harvest = await harvestService.createHarvest(request.body, createdById);
  return reply.code(201).send({ success: true, data: harvest });
}

export async function getHarvestsByFieldIdHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const harvests = await harvestService.getHarvestsByFieldId(request.params.fieldId);
  return reply.send({ success: true, data: harvests });
}

export async function getHarvestByIdHandler(
  request: FastifyRequest<{ Params: HarvestIdParam }>,
  reply: FastifyReply,
) {
  const harvest = await harvestService.getHarvestById(request.params.id);
  if (!harvest) {
    return reply.code(404).send({ success: false, message: "Harvest record not found" });
  }
  return reply.send({ success: true, data: harvest });
}

export async function updateHarvestHandler(
  request: FastifyRequest<{ Params: HarvestIdParam; Body: UpdateHarvestBody }>,
  reply: FastifyReply,
) {
  const harvest = await harvestService.updateHarvest(request.params.id, request.body);
  if (!harvest) {
    return reply.code(404).send({ success: false, message: "Harvest record not found" });
  }
  return reply.send({ success: true, data: harvest });
}

export async function deleteHarvestHandler(
  request: FastifyRequest<{ Params: HarvestIdParam }>,
  reply: FastifyReply,
) {
  const harvest = await harvestService.deleteHarvest(request.params.id);
  if (!harvest) {
    return reply.code(404).send({ success: false, message: "Harvest record not found" });
  }
  return reply.send({ success: true, message: "Harvest deleted successfully" });
}

export async function deleteAllHarvestsForFieldHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const deletedRecords = await harvestService.deleteAllHarvestsForField(request.params.fieldId);
  return reply.send({
    success: true,
    message: `Successfully deleted ${deletedRecords.length} harvest records for this field.`,
    count: deletedRecords.length,
  });
}
