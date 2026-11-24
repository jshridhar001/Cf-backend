import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateFacilityStockBody,
  FacilityStockIdParam,
  ListFacilityStockQuery,
  UpdateFacilityStockBody,
} from "@/features/master/facility-stock/facility-stock.schema.js";
import {
  FacilityStockCrudError,
  facilityStockService,
} from "@/features/master/facility-stock/facility-stock.service.js";
import { isUniqueViolation } from "@/lib/postgres-errors.js";

const duplicateStockMessage =
  "A stock row for this facility, variety, size, and generation already exists.";

export async function getAllFacilityStocks(
  request: FastifyRequest<{ Querystring: ListFacilityStockQuery }>,
  reply: FastifyReply,
) {
  const data = await facilityStockService.getAllFacilityStocks(request.query.facilityId);
  return reply.send({ success: true, data });
}

export async function getFacilityStockSummary(_request: FastifyRequest, reply: FastifyReply) {
  const data = await facilityStockService.getFacilityStockSummary();
  return reply.send({ success: true, data });
}

export async function createFacilityStock(
  request: FastifyRequest<{ Body: CreateFacilityStockBody }>,
  reply: FastifyReply,
) {
  try {
    const created = await facilityStockService.createFacilityStock(request.body);
    return reply.status(201).send({ success: true, data: created });
  } catch (error) {
    if (error instanceof FacilityStockCrudError) {
      return reply.status(error.statusCode).send({ success: false, error: error.message });
    }
    if (isUniqueViolation(error)) {
      return reply.status(409).send({ success: false, error: duplicateStockMessage });
    }
    throw error;
  }
}

export async function updateFacilityStock(
  request: FastifyRequest<{ Params: FacilityStockIdParam; Body: UpdateFacilityStockBody }>,
  reply: FastifyReply,
) {
  try {
    const updated = await facilityStockService.updateFacilityStock(request.params.id, request.body);

    if (!updated) {
      return reply.status(404).send({ success: false, error: "Facility stock not found." });
    }

    return reply.send({ success: true, data: updated });
  } catch (error) {
    if (error instanceof FacilityStockCrudError) {
      return reply.status(error.statusCode).send({ success: false, error: error.message });
    }
    if (isUniqueViolation(error)) {
      return reply.status(409).send({ success: false, error: duplicateStockMessage });
    }
    throw error;
  }
}

export async function deleteFacilityStock(
  request: FastifyRequest<{ Params: FacilityStockIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await facilityStockService.deleteFacilityStock(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Facility stock not found." });
  }

  return reply.send({ success: true, message: "Facility stock deleted successfully." });
}

export async function deleteAllFacilityStocks(_request: FastifyRequest, reply: FastifyReply) {
  await facilityStockService.deleteAllFacilityStocks();
  return reply.send({ success: true, message: "All facility stock deleted permanently." });
}
