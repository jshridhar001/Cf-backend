import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreatePostOfficeBody,
  PostOfficeIdParam,
  UpdatePostOfficeBody,
} from "@/features/master/post-offices/post-offices.schema.js";
import { postOfficesService } from "@/features/master/post-offices/post-offices.service.js";
import { isUniqueViolation } from "@/lib/postgres-errors.js";

// --- READ ---
export async function getAllPostOffices(_request: FastifyRequest, reply: FastifyReply) {
  const data = await postOfficesService.getAllPostOffices();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createPostOffice(
  request: FastifyRequest<{ Body: CreatePostOfficeBody }>,
  reply: FastifyReply,
) {
  try {
    const newPostOffice = await postOfficesService.createPostOffice(request.body.name);
    return reply.status(201).send({ success: true, data: newPostOffice });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send({ success: false, error: "A post office with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updatePostOffice(
  request: FastifyRequest<{ Params: PostOfficeIdParam; Body: UpdatePostOfficeBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedPostOffice = await postOfficesService.updatePostOffice(
      request.params.id,
      request.body.name,
    );

    if (!updatedPostOffice) {
      return reply.status(404).send({ success: false, error: "Post office not found." });
    }

    return reply.send({ success: true, data: updatedPostOffice });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply.status(409).send({ success: false, error: "Post office name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deletePostOffice(
  request: FastifyRequest<{ Params: PostOfficeIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await postOfficesService.deletePostOffice(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Post office not found." });
  }

  return reply.send({ success: true, message: "Post office deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllPostOffices(_request: FastifyRequest, reply: FastifyReply) {
  await postOfficesService.deleteAllPostOffices();
  return reply.send({ success: true, message: "All post offices deleted permanently." });
}
