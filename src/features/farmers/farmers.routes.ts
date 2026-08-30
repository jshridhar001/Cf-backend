import type { FastifyInstance } from "fastify";
import { FarmersController } from "@/features/farmers/farmers.controller.js";
import {
  createFarmerContractSchema,
  createFarmerSchema,
  farmerContractIdParamSchema,
  farmerIdParamSchema,
  updateFarmerContractSchema,
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

  // --- Farmer contract routes ---
  fastify.post(
    "/:id/contracts",
    { schema: { params: farmerIdParamSchema, body: createFarmerContractSchema } },
    FarmersController.createFarmerContract,
  );

  fastify.put(
    "/:id/contracts/:contractId",
    { schema: { params: farmerContractIdParamSchema, body: updateFarmerContractSchema } },
    FarmersController.updateFarmerContract,
  );

  fastify.delete(
    "/:id/contracts/:contractId",
    { schema: { params: farmerContractIdParamSchema } },
    FarmersController.deleteFarmerContract,
  );
}
