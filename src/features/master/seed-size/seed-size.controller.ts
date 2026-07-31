import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateSeedSizeBody,
  SeedSizeIdParam,
  UpdateSeedSizeBody,
} from "@/features/master/seed-size/seed-size.schema.js";
import { seedSizesService } from "@/features/master/seed-size/seed-size.service.js";

function isUniqueViolation(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}

// --- READ ---
export async function getAllSeedSizes(_request: FastifyRequest, reply: FastifyReply) {
  const data = await seedSizesService.getAllSeedSizes();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createSeedSize(
  request: FastifyRequest<{ Body: CreateSeedSizeBody }>,
  reply: FastifyReply,
) {
  try {
    const newSize = await seedSizesService.createSeedSize(request.body);
    return reply.status(201).send({ success: true, data: newSize });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send({ success: false, error: "A seed size with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updateSeedSize(
  request: FastifyRequest<{ Params: SeedSizeIdParam; Body: UpdateSeedSizeBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedSize = await seedSizesService.updateSeedSize(request.params.id, request.body);

    if (!updatedSize) {
      return reply.status(404).send({ success: false, error: "Seed size not found." });
    }

    return reply.send({ success: true, data: updatedSize });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply.status(409).send({ success: false, error: "Seed size name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deleteSeedSize(
  request: FastifyRequest<{ Params: SeedSizeIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await seedSizesService.deleteSeedSize(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Seed size not found." });
  }

  return reply.send({ success: true, message: "Seed size deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllSeedSizes(_request: FastifyRequest, reply: FastifyReply) {
  await seedSizesService.deleteAllSeedSizes();
  return reply.send({ success: true, message: "All seed sizes deleted permanently." });
}
