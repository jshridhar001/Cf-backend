import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateVillageBody,
  UpdateVillageBody,
  VillageIdParam,
} from "@/features/master/villages/villages.schema.js";
import { villagesService } from "@/features/master/villages/villages.service.js";
import { isUniqueViolation } from "@/lib/postgres-errors.js";

// --- READ ---
export async function getAllVillages(_request: FastifyRequest, reply: FastifyReply) {
  const data = await villagesService.getAllVillages();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createVillage(
  request: FastifyRequest<{ Body: CreateVillageBody }>,
  reply: FastifyReply,
) {
  try {
    const newVillage = await villagesService.createVillage(request.body.name);
    return reply.status(201).send({ success: true, data: newVillage });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send({ success: false, error: "A village with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updateVillage(
  request: FastifyRequest<{ Params: VillageIdParam; Body: UpdateVillageBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedVillage = await villagesService.updateVillage(
      request.params.id,
      request.body.name,
    );

    if (!updatedVillage) {
      return reply.status(404).send({ success: false, error: "Village not found." });
    }

    return reply.send({ success: true, data: updatedVillage });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply.status(409).send({ success: false, error: "Village name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deleteVillage(
  request: FastifyRequest<{ Params: VillageIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await villagesService.deleteVillage(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Village not found." });
  }

  return reply.send({ success: true, message: "Village deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllVillages(_request: FastifyRequest, reply: FastifyReply) {
  await villagesService.deleteAllVillages();
  return reply.send({ success: true, message: "All villages deleted permanently." });
}
