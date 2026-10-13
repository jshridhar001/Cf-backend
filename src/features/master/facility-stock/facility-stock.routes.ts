import type { FastifyInstance } from "fastify";
import * as facilityStockController from "@/features/master/facility-stock/facility-stock.controller.js";
import {
  createFacilityStockBodySchema,
  facilityStockIdParamSchema,
  listFacilityStockQuerySchema,
  updateFacilityStockBodySchema,
} from "@/features/master/facility-stock/facility-stock.schema.js";

export async function facilityStockRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    { schema: { querystring: listFacilityStockQuerySchema } },
    facilityStockController.getAllFacilityStocks,
  );

  fastify.post(
    "/",
    { schema: { body: createFacilityStockBodySchema } },
    facilityStockController.createFacilityStock,
  );

  fastify.put(
    "/:id",
    { schema: { params: facilityStockIdParamSchema, body: updateFacilityStockBodySchema } },
    facilityStockController.updateFacilityStock,
  );

  fastify.delete(
    "/:id",
    { schema: { params: facilityStockIdParamSchema } },
    facilityStockController.deleteFacilityStock,
  );

  fastify.delete("/all", facilityStockController.deleteAllFacilityStocks);
}
