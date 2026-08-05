import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateInstructionInput,
  CreateReplyInput,
  FieldIdParam,
  InstructionIdParam,
  UpdateInstructionStatusInput,
} from "@/features/field-instructions/field-instructions.schema.js";
import * as fieldInstructionsService from "@/features/field-instructions/field-instructions.service.js";

export async function createInstructionHandler(
  request: FastifyRequest<{ Body: CreateInstructionInput }>,
  reply: FastifyReply,
) {
  const currentUserId = request.user?.id;
  if (!currentUserId) {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  const instruction = await fieldInstructionsService.createInstruction(request.body, currentUserId);
  return reply.status(201).send({ success: true, data: instruction });
}

export async function getHeadOfficeInstructionsHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const instructions = await fieldInstructionsService.getInstructionsForHeadOffice();
  return reply.send({ success: true, data: instructions });
}

export async function getMyInstructionsHandler(request: FastifyRequest, reply: FastifyReply) {
  const currentUserId = request.user?.id;
  if (!currentUserId) {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  const instructions = await fieldInstructionsService.getInstructionsForOfficer(currentUserId);
  return reply.send({ success: true, data: instructions });
}

export async function getFieldInstructionsHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const instructions = await fieldInstructionsService.getInstructionsByField(
    request.params.fieldId,
  );
  return reply.send({ success: true, data: instructions });
}

export async function updateInstructionStatusHandler(
  request: FastifyRequest<{
    Params: InstructionIdParam;
    Body: UpdateInstructionStatusInput;
  }>,
  reply: FastifyReply,
) {
  const updated = await fieldInstructionsService.updateStatus(
    request.params.instructionId,
    request.body,
  );
  return reply.send({ success: true, data: updated });
}

export async function addReplyHandler(
  request: FastifyRequest<{ Params: InstructionIdParam; Body: CreateReplyInput }>,
  reply: FastifyReply,
) {
  const currentUserId = request.user?.id;
  if (!currentUserId) {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  const replyData = await fieldInstructionsService.addReply(
    request.params.instructionId,
    request.body,
    currentUserId,
  );
  return reply.status(201).send({ success: true, data: replyData });
}
