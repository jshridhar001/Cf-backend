import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateIrrigationBody,
  FieldIdParam,
  IrrigationIdParam,
  UpdateIrrigationBody,
} from "@/features/irrigation/irrigation.schema.js";
import * as irrigationsService from "@/features/irrigation/irrigation.service.js";

function isUniqueIrrigationCycleViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as {
    code?: string;
    constraint?: string;
    cause?: { code?: string; constraint?: string };
  };
  const code = err.code ?? err.cause?.code;
  const constraint = err.constraint ?? err.cause?.constraint;
  return code === "23505" && constraint === "unique_irrigation_cycle_per_field";
}

export async function createIrrigationHandler(
  request: FastifyRequest<{ Body: CreateIrrigationBody }>,
  reply: FastifyReply,
) {
  const createdById = request.user?.id;
  if (!createdById) {
    return reply.code(401).send({ success: false, message: "Unauthorized" });
  }

  try {
    const irrigation = await irrigationsService.createIrrigation(request.body, createdById);
    return reply.code(201).send({ success: true, data: irrigation });
  } catch (error: unknown) {
    if (isUniqueIrrigationCycleViolation(error)) {
      return reply.code(409).send({
        success: false,
        message: `Cycle number ${request.body.cycleNumber} has already been logged for this field.`,
      });
    }
    throw error;
  }
}

export async function getIrrigationsByFieldIdHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const irrigations = await irrigationsService.getIrrigationsByFieldId(request.params.fieldId);
  return reply.send({ success: true, data: irrigations });
}

export async function getIrrigationByIdHandler(
  request: FastifyRequest<{ Params: IrrigationIdParam }>,
  reply: FastifyReply,
) {
  const irrigation = await irrigationsService.getIrrigationById(request.params.id);
  if (!irrigation) {
    return reply.code(404).send({ success: false, message: "Irrigation record not found" });
  }
  return reply.send({ success: true, data: irrigation });
}

export async function updateIrrigationHandler(
  request: FastifyRequest<{ Params: IrrigationIdParam; Body: UpdateIrrigationBody }>,
  reply: FastifyReply,
) {
  try {
    const irrigation = await irrigationsService.updateIrrigation(request.params.id, request.body);
    if (!irrigation) {
      return reply.code(404).send({ success: false, message: "Irrigation record not found" });
    }
    return reply.send({ success: true, data: irrigation });
  } catch (error: unknown) {
    if (isUniqueIrrigationCycleViolation(error)) {
      return reply.code(409).send({
        success: false,
        message: "This cycle number has already been logged for this field.",
      });
    }
    throw error;
  }
}

export async function deleteIrrigationHandler(
  request: FastifyRequest<{ Params: IrrigationIdParam }>,
  reply: FastifyReply,
) {
  const irrigation = await irrigationsService.deleteIrrigation(request.params.id);
  if (!irrigation) {
    return reply.code(404).send({ success: false, message: "Irrigation record not found" });
  }
  return reply.send({ success: true, message: "Irrigation deleted successfully" });
}

export async function deleteAllIrrigationsForFieldHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const deletedRecords = await irrigationsService.deleteAllIrrigationsForField(
    request.params.fieldId,
  );
  return reply.send({
    success: true,
    message: `Successfully deleted ${deletedRecords.length} irrigation records for this field.`,
    count: deletedRecords.length,
  });
}
