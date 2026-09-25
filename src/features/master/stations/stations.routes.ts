import type { FastifyInstance } from "fastify";
import * as stationsController from "@/features/master/stations/stations.controller.js";
import {
  createStationBodySchema,
  stationIdParamSchema,
  updateStationBodySchema,
} from "@/features/master/stations/stations.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function stationRoutes(fastify: FastifyInstance) {
  // 🛡️ Apply Head Office protection to ALL routes in this plugin
  // SUPER_DEVELOPER | MANAGING_DIRECTOR | PROGRAMME_MANAGER
  fastify.addHook("preHandler", requireHeadOffice);

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
