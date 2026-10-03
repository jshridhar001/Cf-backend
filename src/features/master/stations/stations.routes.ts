import type { FastifyInstance } from "fastify";
import * as stationsController from "@/features/master/stations/stations.controller.js";
import {
  createStationBodySchema,
  stationIdParamSchema,
  updateStationBodySchema,
} from "@/features/master/stations/stations.schema.js";

export async function stationRoutes(fastify: FastifyInstance) {
  // --- READ ---
  fastify.get("/", stationsController.getAllStations);

  // --- CREATE ---
  fastify.post(
    "/",
    {
      schema: { body: createStationBodySchema },
    },
    stationsController.createStation,
  );

  // --- UPDATE ---
  fastify.put(
    "/:id",
    {
      schema: { params: stationIdParamSchema, body: updateStationBodySchema },
    },
    stationsController.updateStation,
  );

  // --- DELETE SINGLE ---
  fastify.delete(
    "/:id",
    {
      schema: { params: stationIdParamSchema },
    },
    stationsController.deleteStation,
  );

  // --- DELETE ALL (DANGER ⚠️) ---
  fastify.delete("/all", stationsController.deleteAllStations);
}
