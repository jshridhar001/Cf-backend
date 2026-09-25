import type { FastifyInstance } from "fastify";
import * as policeStationsController from "@/features/master/police-stations/police-stations.controller.js";
import {
  createPoliceStationBodySchema,
  policeStationIdParamSchema,
  updatePoliceStationBodySchema,
} from "@/features/master/police-stations/police-stations.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function policeStationRoutes(fastify: FastifyInstance) {
  // 🛡️ Apply Head Office protection to ALL routes in this plugin
  // SUPER_DEVELOPER | MANAGING_DIRECTOR | PROGRAMME_MANAGER
  fastify.addHook("preHandler", requireHeadOffice);

  // --- READ ---
  fastify.get("/", policeStationsController.getAllPoliceStations);

  // --- CREATE ---
  fastify.post(
    "/",
    {
      schema: { body: createPoliceStationBodySchema },
    },
    policeStationsController.createPoliceStation,
  );

  // --- UPDATE ---
  fastify.put(
    "/:id",
    {
      schema: { params: policeStationIdParamSchema, body: updatePoliceStationBodySchema },
    },
    policeStationsController.updatePoliceStation,
  );

  // --- DELETE SINGLE ---
  fastify.delete(
    "/:id",
    {
      schema: { params: policeStationIdParamSchema },
    },
    policeStationsController.deletePoliceStation,
  );

  // --- DELETE ALL (DANGER ⚠️) ---
  fastify.delete("/all", policeStationsController.deleteAllPoliceStations);
}
