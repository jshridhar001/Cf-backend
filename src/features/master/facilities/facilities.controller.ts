import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateFacilityBody,
  FacilityIdParam,
  UpdateFacilityBody,
} from "@/features/master/facilities/facilites.schema.js";
import { facilitiesService } from "@/features/master/facilities/facilities.service.js";

// --- READ ---
export async function getAllFacilities(_request: FastifyRequest, reply: FastifyReply) {
  const data = await facilitiesService.getAllFacilities();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createFacility(
  request: FastifyRequest<{ Body: CreateFacilityBody }>,
  reply: FastifyReply,
) {
  try {
    const newFacility = await facilitiesService.createFacility(request.body);
    return reply.status(201).send({ success: true, data: newFacility });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply
        .status(409)
        .send({ success: false, error: "A facility with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updateFacility(
  request: FastifyRequest<{ Params: FacilityIdParam; Body: UpdateFacilityBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedFacility = await facilitiesService.updateFacility(request.params.id, request.body);

    if (!updatedFacility) {
      return reply.status(404).send({ success: false, error: "Facility not found." });
    }

    return reply.send({ success: true, data: updatedFacility });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: "Facility name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deleteFacility(
  request: FastifyRequest<{ Params: FacilityIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await facilitiesService.deleteFacility(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Facility not found." });
  }

  return reply.send({ success: true, message: "Facility deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllFacilities(_request: FastifyRequest, reply: FastifyReply) {
  await facilitiesService.deleteAllFacilities();
  return reply.send({ success: true, message: "All facilities deleted permanently." });
}
