import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreatePincodeBody,
  PincodeIdParam,
  UpdatePincodeBody,
} from "@/features/master/pincodes/pincodes.schema.js";
import { pincodesService } from "@/features/master/pincodes/pincodes.service.js";
import { isUniqueViolation } from "@/lib/postgres-errors.js";

// --- READ ---
export async function getAllPincodes(_request: FastifyRequest, reply: FastifyReply) {
  const data = await pincodesService.getAllPincodes();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createPincode(
  request: FastifyRequest<{ Body: CreatePincodeBody }>,
  reply: FastifyReply,
) {
  try {
    const newPincode = await pincodesService.createPincode(request.body.name);
    return reply.status(201).send({ success: true, data: newPincode });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send({ success: false, error: "A pincode with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updatePincode(
  request: FastifyRequest<{ Params: PincodeIdParam; Body: UpdatePincodeBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedPincode = await pincodesService.updatePincode(
      request.params.id,
      request.body.name,
    );

    if (!updatedPincode) {
      return reply.status(404).send({ success: false, error: "Pincode not found." });
    }

    return reply.send({ success: true, data: updatedPincode });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply.status(409).send({ success: false, error: "Pincode name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deletePincode(
  request: FastifyRequest<{ Params: PincodeIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await pincodesService.deletePincode(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Pincode not found." });
  }

  return reply.send({ success: true, message: "Pincode deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllPincodes(_request: FastifyRequest, reply: FastifyReply) {
  await pincodesService.deleteAllPincodes();
  return reply.send({ success: true, message: "All pincodes deleted permanently." });
}
