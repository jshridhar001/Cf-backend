import type { FastifyInstance } from "fastify";
import { FarmersController } from "@/features/farmers/farmers.controller.js";
import {
  createFarmerSchema,
  farmerIdParamSchema,
  updateFarmerSchema,
} from "@/features/farmers/farmers.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function farmerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireHeadOffice);

  // --- Family Routes (picker only) ---
  fastify.get("/families", FarmersController.getFamilies);

  // --- Farmer Routes ---
  fastify.get("/", FarmersController.getFarmers);

  fastify.post("/", { schema: { body: createFarmerSchema } }, FarmersController.createFarmer);

  // Register /all before /:id so "all" is not treated as an id
  fastify.delete("/all", FarmersController.deleteAllFarmers);

  fastify.get(
    "/:id/profile",
    { schema: { params: farmerIdParamSchema } },
    FarmersController.getFarmerProfile,
  );

  fastify.get("/:id", { schema: { params: farmerIdParamSchema } }, FarmersController.getFarmerById);

  fastify.put(
    "/:id",
    { schema: { params: farmerIdParamSchema, body: updateFarmerSchema } },
    FarmersController.updateFarmer,
  );

  fastify.delete(
    "/:id",
    { schema: { params: farmerIdParamSchema } },
    FarmersController.deleteFarmer,
  );
}
