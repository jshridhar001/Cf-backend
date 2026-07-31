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
  fastify.addHook("preHandler", requireHeadOffice);

  fastify.get("/", stationsController.getAllStations);

  fastify.get(
    "/:id",
    { schema: { params: stationIdParamSchema } },
    stationsController.getStationById,
  );

  fastify.post(
    "/",
    { schema: { body: createStationBodySchema } },
    stationsController.createStation,
  );

  fastify.put(
    "/:id",
    { schema: { params: stationIdParamSchema, body: updateStationBodySchema } },
    stationsController.updateStation,
  );

  fastify.delete(
    "/:id",
    { schema: { params: stationIdParamSchema } },
    stationsController.deleteStation,
  );

  fastify.delete("/all", stationsController.deleteAllStations);
}
