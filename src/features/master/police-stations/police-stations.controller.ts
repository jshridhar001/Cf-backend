import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreatePoliceStationBody,
  PoliceStationIdParam,
  UpdatePoliceStationBody,
} from "@/features/master/police-stations/police-stations.schema.js";
import { policeStationsService } from "@/features/master/police-stations/police-stations.service.js";
import { isUniqueViolation } from "@/lib/postgres-errors.js";

// --- READ ---
export async function getAllPoliceStations(_request: FastifyRequest, reply: FastifyReply) {
  const data = await policeStationsService.getAllPoliceStations();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createPoliceStation(
  request: FastifyRequest<{ Body: CreatePoliceStationBody }>,
  reply: FastifyReply,
) {
  try {
    const newPoliceStation = await policeStationsService.createPoliceStation(request.body.name);
    return reply.status(201).send({ success: true, data: newPoliceStation });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send({ success: false, error: "A police station with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updatePoliceStation(
  request: FastifyRequest<{ Params: PoliceStationIdParam; Body: UpdatePoliceStationBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedPoliceStation = await policeStationsService.updatePoliceStation(
      request.params.id,
      request.body.name,
    );

    if (!updatedPoliceStation) {
      return reply.status(404).send({ success: false, error: "Police station not found." });
    }

    return reply.send({ success: true, data: updatedPoliceStation });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send({ success: false, error: "Police station name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deletePoliceStation(
  request: FastifyRequest<{ Params: PoliceStationIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await policeStationsService.deletePoliceStation(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Police station not found." });
  }

  return reply.send({ success: true, message: "Police station deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllPoliceStations(_request: FastifyRequest, reply: FastifyReply) {
  await policeStationsService.deleteAllPoliceStations();
  return reply.send({ success: true, message: "All police stations deleted permanently." });
}
