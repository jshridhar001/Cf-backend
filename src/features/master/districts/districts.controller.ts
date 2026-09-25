import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateDistrictBody,
  DistrictIdParam,
  UpdateDistrictBody,
} from "@/features/master/districts/districts.schema.js";
import { districtsService } from "@/features/master/districts/districts.service.js";
import { isUniqueViolation } from "@/lib/postgres-errors.js";

// --- READ ---
export async function getAllDistricts(_request: FastifyRequest, reply: FastifyReply) {
  const data = await districtsService.getAllDistricts();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createDistrict(
  request: FastifyRequest<{ Body: CreateDistrictBody }>,
  reply: FastifyReply,
) {
  try {
    const newDistrict = await districtsService.createDistrict(request.body.name);
    return reply.status(201).send({ success: true, data: newDistrict });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send({ success: false, error: "A district with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updateDistrict(
  request: FastifyRequest<{ Params: DistrictIdParam; Body: UpdateDistrictBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedDistrict = await districtsService.updateDistrict(
      request.params.id,
      request.body.name,
    );

    if (!updatedDistrict) {
      return reply.status(404).send({ success: false, error: "District not found." });
    }

    return reply.send({ success: true, data: updatedDistrict });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply.status(409).send({ success: false, error: "District name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deleteDistrict(
  request: FastifyRequest<{ Params: DistrictIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await districtsService.deleteDistrict(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "District not found." });
  }

  return reply.send({ success: true, message: "District deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllDistricts(_request: FastifyRequest, reply: FastifyReply) {
  await districtsService.deleteAllDistricts();
  return reply.send({ success: true, message: "All districts deleted permanently." });
}
