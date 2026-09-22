import type { FastifyInstance } from "fastify";
import * as addressesController from "@/features/master/addresses/addresses.controller.js";
import {
  createAreaBodySchema,
  createDistrictBodySchema,
  createPoliceStationBodySchema,
  createPostOfficeBodySchema,
  createStateBodySchema,
  createVillageBodySchema,
  idParamSchema,
  parentIdQuerySchema,
  updateAreaBodySchema,
  updateDistrictBodySchema,
  updatePoliceStationBodySchema,
  updatePostOfficeBodySchema,
  updateStateBodySchema,
  updateVillageBodySchema,
} from "@/features/master/addresses/addresses.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function stateRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireHeadOffice);

  fastify.get("/", addressesController.getAllStates);
  fastify.get("/:id", { schema: { params: idParamSchema } }, addressesController.getStateById);
  fastify.post("/", { schema: { body: createStateBodySchema } }, addressesController.createState);
  fastify.put(
    "/:id",
    { schema: { params: idParamSchema, body: updateStateBodySchema } },
    addressesController.updateState,
  );
  fastify.delete("/all", addressesController.deleteAllStates);
  fastify.delete("/:id", { schema: { params: idParamSchema } }, addressesController.deleteState);
}

export async function districtRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireHeadOffice);

  fastify.get(
    "/",
    { schema: { querystring: parentIdQuerySchema } },
    addressesController.getAllDistricts,
  );
  fastify.get("/:id", { schema: { params: idParamSchema } }, addressesController.getDistrictById);
  fastify.post(
    "/",
    { schema: { body: createDistrictBodySchema } },
    addressesController.createDistrict,
  );
  fastify.put(
    "/:id",
    { schema: { params: idParamSchema, body: updateDistrictBodySchema } },
    addressesController.updateDistrict,
  );
  fastify.delete("/all", addressesController.deleteAllDistricts);
  fastify.delete("/:id", { schema: { params: idParamSchema } }, addressesController.deleteDistrict);
}

export async function postOfficeRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireHeadOffice);

  fastify.get(
    "/",
    { schema: { querystring: parentIdQuerySchema } },
    addressesController.getAllPostOffices,
  );
  fastify.get("/:id", { schema: { params: idParamSchema } }, addressesController.getPostOfficeById);
  fastify.post(
    "/",
    { schema: { body: createPostOfficeBodySchema } },
    addressesController.createPostOffice,
  );
  fastify.put(
    "/:id",
    { schema: { params: idParamSchema, body: updatePostOfficeBodySchema } },
    addressesController.updatePostOffice,
  );
  fastify.delete("/all", addressesController.deleteAllPostOffices);
  fastify.delete(
    "/:id",
    { schema: { params: idParamSchema } },
    addressesController.deletePostOffice,
  );
}

export async function policeStationRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireHeadOffice);

  fastify.get(
    "/",
    { schema: { querystring: parentIdQuerySchema } },
    addressesController.getAllPoliceStations,
  );
  fastify.get(
    "/:id",
    { schema: { params: idParamSchema } },
    addressesController.getPoliceStationById,
  );
  fastify.post(
    "/",
    { schema: { body: createPoliceStationBodySchema } },
    addressesController.createPoliceStation,
  );
  fastify.put(
    "/:id",
    { schema: { params: idParamSchema, body: updatePoliceStationBodySchema } },
    addressesController.updatePoliceStation,
  );
  fastify.delete("/all", addressesController.deleteAllPoliceStations);
  fastify.delete(
    "/:id",
    { schema: { params: idParamSchema } },
    addressesController.deletePoliceStation,
  );
}

export async function villageRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireHeadOffice);

  fastify.get(
    "/",
    { schema: { querystring: parentIdQuerySchema } },
    addressesController.getAllVillages,
  );
  fastify.get("/:id", { schema: { params: idParamSchema } }, addressesController.getVillageById);
  fastify.post(
    "/",
    { schema: { body: createVillageBodySchema } },
    addressesController.createVillage,
  );
  fastify.put(
    "/:id",
    { schema: { params: idParamSchema, body: updateVillageBodySchema } },
    addressesController.updateVillage,
  );
  fastify.delete("/all", addressesController.deleteAllVillages);
  fastify.delete("/:id", { schema: { params: idParamSchema } }, addressesController.deleteVillage);
}

export async function areaRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireHeadOffice);

  fastify.get(
    "/",
    { schema: { querystring: parentIdQuerySchema } },
    addressesController.getAllAreas,
  );
  fastify.get("/:id", { schema: { params: idParamSchema } }, addressesController.getAreaById);
  fastify.post("/", { schema: { body: createAreaBodySchema } }, addressesController.createArea);
  fastify.put(
    "/:id",
    { schema: { params: idParamSchema, body: updateAreaBodySchema } },
    addressesController.updateArea,
  );
  fastify.delete("/all", addressesController.deleteAllAreas);
  fastify.delete("/:id", { schema: { params: idParamSchema } }, addressesController.deleteArea);
}
