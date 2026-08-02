import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateStripTestBody,
  FieldIdParam,
  StripTestIdParam,
} from "@/features/strip-test/strip-test.schema.js";
import * as stripTestService from "@/features/strip-test/strip-test.service.js";

function isUniqueTuberSizeViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as {
    code?: string;
    constraint?: string;
    cause?: { code?: string; constraint?: string };
  };
  const code = err.code ?? err.cause?.code;
  const constraint = err.constraint ?? err.cause?.constraint;
  return code === "23505" && constraint === "unique_tuber_size_per_strip_test";
}

export async function createStripTestHandler(
  request: FastifyRequest<{ Body: CreateStripTestBody }>,
  reply: FastifyReply,
) {
  const createdById = request.user?.id;
  if (!createdById) {
    return reply.code(401).send({ success: false, message: "Unauthorized" });
  }

  try {
    const stripTest = await stripTestService.createStripTest(request.body, createdById);
    return reply.code(201).send({ success: true, data: stripTest });
  } catch (error: unknown) {
    if (isUniqueTuberSizeViolation(error)) {
      return reply.code(409).send({
        success: false,
        message: "Each tuber size can only appear once per strip test.",
      });
    }
    throw error;
  }
}

export async function getStripTestsByFieldIdHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const stripTests = await stripTestService.getStripTestsByFieldId(request.params.fieldId);
  return reply.send({ success: true, data: stripTests });
}

export async function getStripTestByIdHandler(
  request: FastifyRequest<{ Params: StripTestIdParam }>,
  reply: FastifyReply,
) {
  const stripTest = await stripTestService.getStripTestById(request.params.id);
  if (!stripTest) {
    return reply.code(404).send({ success: false, message: "Strip Test record not found" });
  }
  return reply.send({ success: true, data: stripTest });
}

export async function deleteStripTestHandler(
  request: FastifyRequest<{ Params: StripTestIdParam }>,
  reply: FastifyReply,
) {
  const stripTest = await stripTestService.deleteStripTest(request.params.id);
  if (!stripTest) {
    return reply.code(404).send({ success: false, message: "Strip Test record not found" });
  }
  return reply.send({ success: true, message: "Strip Test deleted successfully" });
}

export async function deleteAllStripTestsForFieldHandler(
  request: FastifyRequest<{ Params: FieldIdParam }>,
  reply: FastifyReply,
) {
  const deletedRecords = await stripTestService.deleteAllStripTestsForField(request.params.fieldId);
  return reply.send({
    success: true,
    message: `Successfully deleted ${deletedRecords.length} strip test records for this field.`,
    count: deletedRecords.length,
  });
}
