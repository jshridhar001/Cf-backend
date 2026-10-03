import type { FastifyInstance } from "fastify";
import {
  createFacilityBodySchema,
  facilityIdParamSchema,
  updateFacilityBodySchema,
} from "@/features/master/facilities/facilites.schema.js";
import * as facilitiesController from "@/features/master/facilities/facilities.controller.js";

export async function facilityRoutes(fastify: FastifyInstance) {
  fastify.get("/", facilitiesController.getAllFacilities);

  fastify.post(
    "/",
    { schema: { body: createFacilityBodySchema } },
    facilitiesController.createFacility,
  );

  fastify.put(
    "/:id",
    { schema: { params: facilityIdParamSchema, body: updateFacilityBodySchema } },
    facilitiesController.updateFacility,
  );

  fastify.delete(
    "/:id",
    { schema: { params: facilityIdParamSchema } },
    facilitiesController.deleteFacility,
  );

  fastify.delete("/all", facilitiesController.deleteAllFacilities);
}
