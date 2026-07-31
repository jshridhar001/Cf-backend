import type { FastifyInstance } from "fastify";
import {
  createFacilityBodySchema,
  facilityIdParamSchema,
  updateFacilityBodySchema,
} from "@/features/master/facilities/facilites.schema.js";
import * as facilitiesController from "@/features/master/facilities/facilities.controller.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function facilityRoutes(fastify: FastifyInstance) {
  // 🛡️ Apply Head Office protection to ALL routes in this plugin
  fastify.addHook("preHandler", requireHeadOffice);

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
