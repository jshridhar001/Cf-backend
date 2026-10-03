import type { FastifyInstance } from "fastify";
import * as districtsController from "@/features/master/districts/districts.controller.js";
import {
  createDistrictBodySchema,
  districtIdParamSchema,
  updateDistrictBodySchema,
} from "@/features/master/districts/districts.schema.js";

export async function districtRoutes(fastify: FastifyInstance) {
  // --- READ ---
  fastify.get("/", districtsController.getAllDistricts);

  // --- CREATE ---
  fastify.post(
    "/",
    {
      schema: { body: createDistrictBodySchema },
    },
    districtsController.createDistrict,
  );

  // --- UPDATE ---
  fastify.put(
    "/:id",
    {
      schema: { params: districtIdParamSchema, body: updateDistrictBodySchema },
    },
    districtsController.updateDistrict,
  );

  // --- DELETE SINGLE ---
  fastify.delete(
    "/:id",
    {
      schema: { params: districtIdParamSchema },
    },
    districtsController.deleteDistrict,
  );

  // --- DELETE ALL (DANGER ⚠️) ---
  fastify.delete("/all", districtsController.deleteAllDistricts);
}
