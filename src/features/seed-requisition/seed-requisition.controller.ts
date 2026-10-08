import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateSeedRequisitionBody,
  DecideSeedRequisitionBody,
  SeedRequisitionIdParam,
  UpdateSeedRequisitionBody,
} from "@/features/seed-requisition/seed-requisition.schema.js";
import { seedRequisitionsService } from "@/features/seed-requisition/seed-requisition.service.js";
import { isForeignKeyViolation } from "@/lib/postgres-errors.js";

export async function getAllSeedRequisitions(_request: FastifyRequest, reply: FastifyReply) {
  const data = await seedRequisitionsService.getAllSeedRequisitions();
  return reply.send({ success: true, data });
}

export async function getSeedRequisitionById(
  request: FastifyRequest<{ Params: SeedRequisitionIdParam }>,
  reply: FastifyReply,
) {
  const data = await seedRequisitionsService.getSeedRequisitionById(request.params.id);

  if (!data) {
    return reply.code(404).send({
      success: false,
      error: { code: "NOT_FOUND", message: "Seed requisition not found" },
    });
  }

  return reply.send({ success: true, data });
}

export async function createSeedRequisition(
  request: FastifyRequest<{ Body: CreateSeedRequisitionBody }>,
  reply: FastifyReply,
) {
  const createdById = request.user?.id;
  if (!createdById) {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  try {
    const data = await seedRequisitionsService.createSeedRequisition(request.body, createdById);
    return reply.code(201).send({ success: true, data });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return reply.code(400).send({
        success: false,
        error: { code: "BAD_REQUEST", message: "Invalid farmer or variety" },
      });
    }
    throw error;
  }
}

export async function updateSeedRequisition(
  request: FastifyRequest<{ Params: SeedRequisitionIdParam; Body: UpdateSeedRequisitionBody }>,
  reply: FastifyReply,
) {
  try {
    const data = await seedRequisitionsService.updateSeedRequisition(
      request.params.id,
      request.body,
    );

    if (!data) {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Seed requisition not found" },
      });
    }

    return reply.send({ success: true, data });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return reply.code(400).send({
        success: false,
        error: { code: "BAD_REQUEST", message: "Invalid farmer or variety" },
      });
    }
    throw error;
  }
}

export async function decideSeedRequisition(
  request: FastifyRequest<{ Params: SeedRequisitionIdParam; Body: DecideSeedRequisitionBody }>,
  reply: FastifyReply,
) {
  const decidedById = request.user?.id;
  if (!decidedById) {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  const result = await seedRequisitionsService.decideSeedRequisition(
    request.params.id,
    request.body,
    decidedById,
  );

  if (result.error === "not_found") {
    return reply.code(404).send({
      success: false,
      error: { code: "NOT_FOUND", message: "Seed requisition not found" },
    });
  }

  if (result.error === "not_pending") {
    return reply.code(409).send({
      success: false,
      error: {
        code: "CONFLICT",
        message: "Only pending seed requisitions can be approved or rejected",
      },
    });
  }

  return reply.send({ success: true, data: result.data });
}

export async function deleteSeedRequisition(
  request: FastifyRequest<{ Params: SeedRequisitionIdParam }>,
  reply: FastifyReply,
) {
  try {
    const deleted = await seedRequisitionsService.deleteSeedRequisition(request.params.id);

    if (!deleted) {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Seed requisition not found" },
      });
    }

    return reply.send({ success: true, message: "Seed requisition deleted successfully." });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return reply.code(409).send({
        success: false,
        error: {
          code: "CONFLICT",
          message: "Seed requisition is linked to a dispatch and cannot be deleted",
        },
      });
    }
    throw error;
  }
}

export async function deleteAllSeedRequisitions(_request: FastifyRequest, reply: FastifyReply) {
  try {
    await seedRequisitionsService.deleteAllSeedRequisitions();
    return reply.send({ success: true, message: "All seed requisitions deleted permanently." });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return reply.code(409).send({
        success: false,
        error: {
          code: "CONFLICT",
          message: "A seed requisition is linked to a dispatch and cannot be deleted",
        },
      });
    }
    throw error;
  }
}
