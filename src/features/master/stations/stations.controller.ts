import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateStationBody,
  StationIdParam,
  UpdateStationBody,
} from "@/features/master/stations/stations.schema.js";
import { stationsService } from "@/features/master/stations/stations.service.js";
import { isUniqueViolation } from "@/lib/postgres-errors.js";

// --- READ ---
export async function getAllStations(_request: FastifyRequest, reply: FastifyReply) {
  const data = await stationsService.getAllStations();
  return reply.send({ success: true, data });
}

// --- CREATE ---
export async function createStation(
  request: FastifyRequest<{ Body: CreateStationBody }>,
  reply: FastifyReply,
) {
  try {
    const newStation = await stationsService.createStation(request.body.name);
    return reply.status(201).send({ success: true, data: newStation });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply
        .status(409)
        .send({ success: false, error: "A station with this name already exists." });
    }
    throw error;
  }
}

// --- UPDATE ---
export async function updateStation(
  request: FastifyRequest<{ Params: StationIdParam; Body: UpdateStationBody }>,
  reply: FastifyReply,
) {
  try {
    const updatedStation = await stationsService.updateStation(
      request.params.id,
      request.body.name,
    );

    if (!updatedStation) {
      return reply.status(404).send({ success: false, error: "Station not found." });
    }

    return reply.send({ success: true, data: updatedStation });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return reply.status(409).send({ success: false, error: "Station name already taken." });
    }
    throw error;
  }
}

// --- DELETE SINGLE ---
export async function deleteStation(
  request: FastifyRequest<{ Params: StationIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await stationsService.deleteStation(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Station not found." });
  }

  return reply.send({ success: true, message: "Station deleted successfully." });
}

// --- DELETE ALL ---
export async function deleteAllStations(_request: FastifyRequest, reply: FastifyReply) {
  await stationsService.deleteAllStations();
  return reply.send({ success: true, message: "All stations deleted permanently." });
}
