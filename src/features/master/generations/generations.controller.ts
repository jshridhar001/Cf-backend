import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateGenerationBody,
  GenerationIdParam,
  UpdateGenerationBody,
} from "@/features/master/generations/generations.schema.js";
import { generationsService } from "@/features/master/generations/generations.service.js";

// --- READ ---
export async function getAllGenerations(_request: FastifyRequest, reply: FastifyReply) {
  const data = await generationsService.getAllGenerations();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createGeneration(
  request: FastifyRequest<{ Body: CreateGenerationBody }>,
  reply: FastifyReply,
) {
  try {
    const newGeneration = await generationsService.createGeneration(request.body.name);
    return reply.status(201).send({ success: true, data: newGeneration });
  } catch (error: any) {
    // Handle Postgres unique constraint violation
    if (error.code === "23505") {
      return reply
        .status(409)
        .send({ success: false, error: "A generation with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updateGeneration(
  request: FastifyRequest<{ Params: GenerationIdParam; Body: UpdateGenerationBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedGeneration = await generationsService.updateGeneration(
      request.params.id,
      request.body.name,
    );

    if (!updatedGeneration) {
      return reply.status(404).send({ success: false, error: "Generation not found." });
    }

    return reply.send({ success: true, data: updatedGeneration });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: "Generation name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deleteGeneration(
  request: FastifyRequest<{ Params: GenerationIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await generationsService.deleteGeneration(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Generation not found." });
  }

  return reply.send({ success: true, message: "Generation deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllGenerations(_request: FastifyRequest, reply: FastifyReply) {
  await generationsService.deleteAllGenerations();
  return reply.send({ success: true, message: "All generations deleted permanently." });
}
