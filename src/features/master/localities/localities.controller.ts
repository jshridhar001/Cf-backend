import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateLocalityBody,
  LocalityIdParam,
  UpdateLocalityBody,
} from "@/features/master/localities/localities.schema.js";
import { localitiesService } from "@/features/master/localities/localities.service.js";

// --- READ ---
export async function getAllLocalities(_request: FastifyRequest, reply: FastifyReply) {
  const data = await localitiesService.getAllLocalities();
  return reply.send({ success: true, data });
}

export async function getLocalityById(
  request: FastifyRequest<{ Params: LocalityIdParam }>,
  reply: FastifyReply,
) {
  const locality = await localitiesService.getLocalityById(request.params.id);
  if (!locality) {
    return reply.status(404).send({ success: false, error: "Locality not found." });
  }
  return reply.send({ success: true, data: locality });
}

// --- CREATE ---
export async function createLocality(
  request: FastifyRequest<{ Body: CreateLocalityBody }>,
  reply: FastifyReply,
) {
  try {
    const newLocality = await localitiesService.createLocality(request.body);
    return reply.status(201).send({ success: true, data: newLocality });
  } catch (error: any) {
    // 23503 is the Postgres error code for a Foreign Key Violation
    if (error.code === "23503") {
      return reply
        .status(400)
        .send({ success: false, error: "The provided Station ID does not exist." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updateLocality(
  request: FastifyRequest<{ Params: LocalityIdParam; Body: UpdateLocalityBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedLocality = await localitiesService.updateLocality(request.params.id, request.body);

    if (!updatedLocality) {
      return reply.status(404).send({ success: false, error: "Locality not found." });
    }

    return reply.send({ success: true, data: updatedLocality });
  } catch (error: any) {
    if (error.code === "23503") {
      return reply
        .status(400)
        .send({ success: false, error: "The provided Station ID does not exist." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deleteLocality(
  request: FastifyRequest<{ Params: LocalityIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await localitiesService.deleteLocality(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Locality not found." });
  }

  return reply.send({ success: true, message: "Locality deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllLocalities(_request: FastifyRequest, reply: FastifyReply) {
  await localitiesService.deleteAllLocalities();
  return reply.send({ success: true, message: "All localities deleted permanently." });
}
