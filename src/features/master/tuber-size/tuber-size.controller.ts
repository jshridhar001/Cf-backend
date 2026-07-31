import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateTuberSizeBody,
  TuberSizeIdParam,
  UpdateTuberSizeBody,
} from "@/features/master/tuber-size/tuber-size.schema.js";
import { tuberSizesService } from "@/features/master/tuber-size/tuber-size.service.js";

// --- READ ---
export async function getAllTuberSizes(_request: FastifyRequest, reply: FastifyReply) {
  const data = await tuberSizesService.getAllTuberSizes();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createTuberSize(
  request: FastifyRequest<{ Body: CreateTuberSizeBody }>,
  reply: FastifyReply,
) {
  try {
    const newTuberSize = await tuberSizesService.createTuberSize(request.body.name);
    return reply.status(201).send({ success: true, data: newTuberSize });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply
        .status(409)
        .send({ success: false, error: "A tuber size with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updateTuberSize(
  request: FastifyRequest<{ Params: TuberSizeIdParam; Body: UpdateTuberSizeBody }>,
  reply: FastifyReply,
) {
  try {
    // Only update if a name was actually provided
    if (!request.body.name) {
      return reply.status(400).send({ success: false, error: "Name is required for update." });
    }

    const updatedTuberSize = await tuberSizesService.updateTuberSize(
      request.params.id,
      request.body.name,
    );

    if (!updatedTuberSize) {
      return reply.status(404).send({ success: false, error: "Tuber size not found." });
    }

    return reply.send({ success: true, data: updatedTuberSize });
  } catch (error: any) {
    if (error.code === "23505") {
      return reply.status(409).send({ success: false, error: "Tuber size name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deleteTuberSize(
  request: FastifyRequest<{ Params: TuberSizeIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await tuberSizesService.deleteTuberSize(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Tuber size not found." });
  }

  return reply.send({ success: true, message: "Tuber size deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllTuberSizes(_request: FastifyRequest, reply: FastifyReply) {
  await tuberSizesService.deleteAllTuberSizes();
  return reply.send({ success: true, message: "All tuber sizes deleted permanently." });
}
