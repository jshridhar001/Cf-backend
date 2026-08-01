import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createSeedRequisitionSchema,
  requisitionIdParamSchema,
  reviewRequisitionSchema,
  updateSeedRequisitionSchema,
} from "@/features/seed-requisition/seed-requisition.schema.js";
import * as RequisitionService from "@/features/seed-requisition/seed-requisition.service.js";

export async function createRequisitionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = createSeedRequisitionSchema.parse(request.body);
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({ success: false, message: "Unauthorized" });
    }

    const req = await RequisitionService.createSeedRequisition(body, userId);
    return reply.code(201).send({ success: true, data: req });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return reply
        .code(400)
        .send({ success: false, errors: (error as { issues: unknown }).issues });
    }
    request.log.error(error);
    return reply.code(500).send({ success: false, message: "Internal Server Error" });
  }
}

export async function getAllRequisitionsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const reqs = await RequisitionService.getAllSeedRequisitions();
    return reply.code(200).send({ success: true, data: reqs });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ success: false, message: "Internal Server Error" });
  }
}

export async function getRequisitionByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = requisitionIdParamSchema.parse(request.params);
    const req = await RequisitionService.getSeedRequisitionById(id);
    if (!req) return reply.code(404).send({ success: false, message: "Requisition not found" });
    return reply.code(200).send({ success: true, data: req });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return reply
        .code(400)
        .send({ success: false, errors: (error as { issues: unknown }).issues });
    }
    return reply.code(500).send({ success: false, message: "Internal Server Error" });
  }
}

export async function updateRequisitionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = requisitionIdParamSchema.parse(request.params);
    const body = updateSeedRequisitionSchema.parse(request.body);

    const updatedReq = await RequisitionService.updateSeedRequisition(id, body);
    if (!updatedReq)
      return reply.code(404).send({ success: false, message: "Requisition not found" });
    return reply.code(200).send({ success: true, data: updatedReq });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return reply
        .code(400)
        .send({ success: false, errors: (error as { issues: unknown }).issues });
    }
    return reply.code(500).send({ success: false, message: "Internal Server Error" });
  }
}

export async function reviewRequisitionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = requisitionIdParamSchema.parse(request.params);
    const body = reviewRequisitionSchema.parse(request.body);
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({ success: false, message: "Unauthorized" });
    }

    const reviewedReq = await RequisitionService.reviewSeedRequisition(id, body, userId);
    if (!reviewedReq)
      return reply.code(404).send({ success: false, message: "Requisition not found" });
    return reply.code(200).send({ success: true, data: reviewedReq });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return reply
        .code(400)
        .send({ success: false, errors: (error as { issues: unknown }).issues });
    }
    return reply.code(500).send({ success: false, message: "Internal Server Error" });
  }
}

export async function deleteRequisitionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = requisitionIdParamSchema.parse(request.params);
    const deletedReq = await RequisitionService.deleteSeedRequisition(id);
    if (!deletedReq)
      return reply.code(404).send({ success: false, message: "Requisition not found" });
    return reply.code(200).send({ success: true, data: deletedReq });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return reply
        .code(400)
        .send({ success: false, errors: (error as { issues: unknown }).issues });
    }
    return reply.code(500).send({ success: false, message: "Internal Server Error" });
  }
}

export async function deleteAllRequisitionsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    await RequisitionService.deleteAllSeedRequisitions();
    return reply
      .code(200)
      .send({ success: true, message: "All requisitions deleted successfully" });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ success: false, message: "Internal Server Error" });
  }
}
