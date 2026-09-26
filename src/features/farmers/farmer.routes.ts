import type { FastifyInstance } from "fastify";
import * as farmersController from "@/features/farmers/farmer.controller.js";
import { createFarmerBodySchema, farmerIdParamSchema } from "@/features/farmers/farmer.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function farmerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/", farmersController.getAllFarmers);
  fastify.get("/address-options", farmersController.getAddressOptions);

  fastify.post("/", { schema: { body: createFarmerBodySchema } }, farmersController.createFarmer);

  fastify.put(
    "/:id",
    { schema: { params: farmerIdParamSchema, body: createFarmerBodySchema } },
    farmersController.updateFarmer,
  );

  fastify.delete("/all", farmersController.deleteAllFarmers);

  fastify.delete(
    "/:id",
    { schema: { params: farmerIdParamSchema } },
    farmersController.deleteFarmer,
  );
}
