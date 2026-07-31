import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateStationBody,
  StationIdParam,
  UpdateStationBody,
} from "@/features/master/stations/stations.schema.js";
import { stationsService } from "@/features/master/stations/stations.service.js";

// --- READ ---
export async function getAllStations(_request: FastifyRequest, reply: FastifyReply) {
  const data = await stationsService.getAllStations();
  return reply.send({ success: true, data });
}

export async function getStationById(
  request: FastifyRequest<{ Params: StationIdParam }>,
  reply: FastifyReply,
) {
  const station = await stationsService.getStationById(request.params.id);
  if (!station) {
    return reply.status(404).send({ success: false, error: "Station not found." });
  }
  return reply.send({ success: true, data: station });
}

// --- CREATE ---
export async function createStation(
  request: FastifyRequest<{ Body: CreateStationBody }>,
  reply: FastifyReply,
) {
  const newStation = await stationsService.createStation(request.body);
  return reply.status(201).send({ success: true, data: newStation });
}

// --- UPDATE ---
export async function updateStation(
  request: FastifyRequest<{ Params: StationIdParam; Body: UpdateStationBody }>,
  reply: FastifyReply,
) {
  const updatedStation = await stationsService.updateStation(request.params.id, request.body);

  if (!updatedStation) {
    return reply.status(404).send({ success: false, error: "Station not found." });
  }

  return reply.send({ success: true, data: updatedStation });
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

  return reply.send({
    success: true,
    message: "Station (and all its localities) deleted successfully.",
  });
}

// --- DELETE ALL ---
export async function deleteAllStations(_request: FastifyRequest, reply: FastifyReply) {
  await stationsService.deleteAllStations();
  return reply.send({ success: true, message: "All stations deleted permanently." });
}
