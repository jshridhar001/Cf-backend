import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateFarmerBody, FarmerIdParam } from "@/features/farmers/farmer.schema.js";
import { farmersService } from "@/features/farmers/farmer.service.js";
import {
  isForeignKeyViolation,
  isUniqueViolation,
  postgresConstraint,
} from "@/lib/postgres-errors.js";

function duplicateFarmerMessage(constraint: string | undefined) {
  if (constraint === "farmer_account_number_unique") {
    return "A farmer with this account number already exists.";
  }
  if (constraint === "farmer_aadhar_number_unique") {
    return "A farmer with this Aadhaar number already exists.";
  }
  if (constraint === "farmer_pan_number_unique") {
    return "A farmer with this PAN already exists.";
  }
  if (constraint === "unique_family_primary") {
    return "This family already has a primary account.";
  }
  if (constraint === "farmer_family_account_number_unique") {
    return "A family with this account number already exists.";
  }
  return "A farmer with these details already exists.";
}

export async function getAllFarmers(_request: FastifyRequest, reply: FastifyReply) {
  const data = await farmersService.getAllFarmers();
  return reply.send({ success: true, data });
}

export async function getAddressOptions(_request: FastifyRequest, reply: FastifyReply) {
  const data = await farmersService.getAddressOptions();
  return reply.send({ success: true, data });
}

export async function getFamilies(_request: FastifyRequest, reply: FastifyReply) {
  const data = await farmersService.getFamilies();
  return reply.send({ success: true, data });
}

function sendFarmerWriteError(error: unknown, reply: FastifyReply) {
  if (isUniqueViolation(error)) {
    return reply.status(409).send({
      success: false,
      error: duplicateFarmerMessage(postgresConstraint(error)),
    });
  }
  if (isForeignKeyViolation(error)) {
    return reply.status(400).send({ success: false, error: "Invalid address reference." });
  }
  throw error;
}

export async function createFarmer(
  request: FastifyRequest<{ Body: CreateFarmerBody }>,
  reply: FastifyReply,
) {
  try {
    const farmer = await farmersService.createFarmer(request.body);
    return reply.status(201).send({ success: true, data: farmer });
  } catch (error) {
    return sendFarmerWriteError(error, reply);
  }
}

export async function updateFarmer(
  request: FastifyRequest<{ Params: FarmerIdParam; Body: CreateFarmerBody }>,
  reply: FastifyReply,
) {
  try {
    const farmer = await farmersService.updateFarmer(request.params.id, request.body);

    if (!farmer) {
      return reply.status(404).send({ success: false, error: "Farmer not found." });
    }

    return reply.send({ success: true, data: farmer });
  } catch (error) {
    return sendFarmerWriteError(error, reply);
  }
}

export async function deleteFarmer(
  request: FastifyRequest<{ Params: FarmerIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await farmersService.deleteFarmer(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Farmer not found." });
  }

  return reply.send({ success: true, message: "Farmer deleted successfully." });
}

export async function deleteAllFarmers(_request: FastifyRequest, reply: FastifyReply) {
  await farmersService.deleteAllFarmers();
  return reply.send({ success: true, message: "All farmers deleted permanently." });
}
