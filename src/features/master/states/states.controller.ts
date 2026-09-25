import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateStateBody,
  StateIdParam,
  UpdateStateBody,
} from "@/features/master/states/states.schema.js";
import { statesService } from "@/features/master/states/states.service.js";
import { isUniqueViolation } from "@/lib/postgres-errors.js";

// --- READ ---
export async function getAllStates(_request: FastifyRequest, reply: FastifyReply) {
  const data = await statesService.getAllStates();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createState(
  request: FastifyRequest<{ Body: CreateStateBody }>,
  reply: FastifyReply,
) {
  try {
    const newState = await statesService.createState(request.body.name);
    return reply.status(201).send({ success: true, data: newState });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send({ success: false, error: "A state with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updateState(
  request: FastifyRequest<{ Params: StateIdParam; Body: UpdateStateBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedState = await statesService.updateState(request.params.id, request.body.name);

    if (!updatedState) {
      return reply.status(404).send({ success: false, error: "State not found." });
    }

    return reply.send({ success: true, data: updatedState });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply.status(409).send({ success: false, error: "State name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deleteState(
  request: FastifyRequest<{ Params: StateIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await statesService.deleteState(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "State not found." });
  }

  return reply.send({ success: true, message: "State deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllStates(_request: FastifyRequest, reply: FastifyReply) {
  await statesService.deleteAllStates();
  return reply.send({ success: true, message: "All states deleted permanently." });
}
