import type { FastifyReply, FastifyRequest } from "fastify";
import {
  type CreateFarmerContractBody,
  createFarmerContractSchema,
  createFarmerSchema,
  type FarmerContractIdParam,
  type FarmerIdParam,
  type UpdateFarmerBody,
  type UpdateFarmerContractBody,
  updateFarmerContractSchema,
  updateFarmerSchema,
} from "@/features/farmers/farmers.schema.js";
import { farmersService } from "@/features/farmers/farmers.service.js";

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; cause?: { code?: string } };
  return err.code === "23505" || err.cause?.code === "23505";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

export class FarmersController {
  // --- Families (picker) ---
  static async getFamilies(_request: FastifyRequest, reply: FastifyReply) {
    const families = await farmersService.getFamilies();
    return reply.send({ success: true, data: families });
  }

  // --- Farmers ---
  static async createFarmer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = createFarmerSchema.parse(request.body);
      const farmer = await farmersService.createFarmer(validatedData);
      return reply.status(201).send({ success: true, data: farmer });
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        return reply.status(409).send({
          success: false,
          error:
            "A farmer or family with this unique ID (Account/Aadhar/Family Account) already exists",
        });
      }
      return reply.status(400).send({ success: false, error: errorMessage(error) });
    }
  }

  static async getFarmers(_request: FastifyRequest, reply: FastifyReply) {
    const farmers = await farmersService.getFarmers();
    return reply.send({ success: true, data: farmers });
  }

  static async getFarmerById(
    request: FastifyRequest<{ Params: FarmerIdParam }>,
    reply: FastifyReply,
  ) {
    const farmer = await farmersService.getFarmerById(request.params.id);

    if (!farmer) {
      return reply.status(404).send({ success: false, error: "Farmer not found." });
    }

    return reply.send({ success: true, data: farmer });
  }

  static async updateFarmer(
    request: FastifyRequest<{ Params: FarmerIdParam; Body: UpdateFarmerBody }>,
    reply: FastifyReply,
  ) {
    try {
      const validatedData = updateFarmerSchema.parse(request.body);
      const farmer = await farmersService.updateFarmer(request.params.id, validatedData);

      if (!farmer) {
        return reply.status(404).send({ success: false, error: "Farmer not found." });
      }

      return reply.send({ success: true, data: farmer });
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        return reply.status(409).send({
          success: false,
          error:
            "A farmer or family with this unique ID (Account/Aadhar/Family Account) already exists",
        });
      }
      return reply.status(400).send({ success: false, error: errorMessage(error) });
    }
  }

  static async deleteFarmer(
    request: FastifyRequest<{ Params: FarmerIdParam }>,
    reply: FastifyReply,
  ) {
    const deleted = await farmersService.deleteFarmer(request.params.id);

    if (!deleted) {
      return reply.status(404).send({ success: false, error: "Farmer not found." });
    }

    return reply.send({ success: true, message: "Farmer deleted successfully." });
  }

  static async deleteAllFarmers(_request: FastifyRequest, reply: FastifyReply) {
    await farmersService.deleteAllFarmers();
    return reply.send({ success: true, message: "All farmers deleted permanently." });
  }

  // --- Farmer contracts ---
  static async getFarmerContracts(
    request: FastifyRequest<{ Params: FarmerIdParam }>,
    reply: FastifyReply,
  ) {
    const contracts = await farmersService.getFarmerContracts(request.params.id);

    if (contracts === undefined) {
      return reply.status(404).send({ success: false, error: "Farmer not found." });
    }

    return reply.send({ success: true, data: contracts });
  }

  static async createFarmerContract(
    request: FastifyRequest<{ Params: FarmerIdParam; Body: CreateFarmerContractBody }>,
    reply: FastifyReply,
  ) {
    const validatedData = createFarmerContractSchema.parse(request.body);
    const contract = await farmersService.createFarmerContract(request.params.id, validatedData);

    if (!contract) {
      return reply.status(404).send({ success: false, error: "Farmer not found." });
    }

    return reply.status(201).send({ success: true, data: contract });
  }

  static async updateFarmerContract(
    request: FastifyRequest<{ Params: FarmerContractIdParam; Body: UpdateFarmerContractBody }>,
    reply: FastifyReply,
  ) {
    const validatedData = updateFarmerContractSchema.parse(request.body);
    const contract = await farmersService.updateFarmerContract(
      request.params.id,
      request.params.contractId,
      validatedData,
    );

    if (!contract) {
      return reply.status(404).send({ success: false, error: "Contract not found." });
    }

    return reply.send({ success: true, data: contract });
  }

  static async deleteFarmerContract(
    request: FastifyRequest<{ Params: FarmerContractIdParam }>,
    reply: FastifyReply,
  ) {
    const deleted = await farmersService.deleteFarmerContract(
      request.params.id,
      request.params.contractId,
    );

    if (!deleted) {
      return reply.status(404).send({ success: false, error: "Contract not found." });
    }

    return reply.send({ success: true, message: "Contract deleted successfully." });
  }
}
