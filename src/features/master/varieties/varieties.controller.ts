import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateVarietyBody,
  UpdateVarietyBody,
  VarietyIdParam,
} from "@/features/master/varieties/varieties.schema.js";
import { varietiesService } from "@/features/master/varieties/varieties.service.js";

// --- READ ---
export async function getAllVarieties(_request: FastifyRequest, reply: FastifyReply) {
  const varieties = await varietiesService.getAllVarieties();
  return reply.send({ success: true, data: varieties });
}

// --- CREATE ---
export async function createVariety(
  request: FastifyRequest<{ Body: CreateVarietyBody }>,
  reply: FastifyReply,
) {
  try {
    const newVariety = await varietiesService.createVariety(request.body.name);
    return reply.status(201).send({ success: true, data: newVariety });
  } catch (error: any) {
    // Handle Postgres unique constraint violation
    if (error.code === "23505") {
      return reply
        .status(409)
        .send({ success: false, error: "A variety with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updateVariety(
  request: FastifyRequest<{ Params: VarietyIdParam; Body: UpdateVarietyBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedVariety = await varietiesService.updateVariety(
      request.params.id,
      request.body.name,
    );

    if (!updatedVariety) {
      return reply.status(404).send({ success: false, error: "Variety not found." });
    }

    return reply.send({ success: true, data: updatedVariety });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: "Variety name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deleteVariety(
  request: FastifyRequest<{ Params: VarietyIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await varietiesService.deleteVariety(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Variety not found." });
  }

  return reply.send({ success: true, message: "Variety deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllVarieties(_request: FastifyRequest, reply: FastifyReply) {
  await varietiesService.deleteAllVarieties();
  return reply.send({ success: true, message: "All varieties deleted permanently." });
}
