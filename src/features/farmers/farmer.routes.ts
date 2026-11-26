import type { FastifyInstance } from "fastify";
import * as farmersController from "@/features/farmers/farmer.controller.js";
import {
  createFarmerBodySchema,
  farmerIdParamSchema,
  farmerReportQuerySchema,
} from "@/features/farmers/farmer.schema.js";
import * as farmerConfirmationController from "@/features/farmers/farmer-confirmation.controller.js";
import { confirmFarmerOtpBodySchema } from "@/features/farmers/farmer-confirmation.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function farmerRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/", farmersController.getAllFarmers);
  fastify.get("/address-options", farmersController.getAddressOptions);
  fastify.get("/families", farmersController.getFamilies);
  fastify.get(
    "/report",
    { schema: { querystring: farmerReportQuerySchema } },
    farmersController.getSeedReport,
  );
  fastify.get(
    "/:id/stock",
    { schema: { params: farmerIdParamSchema } },
    farmersController.getFarmerStock,
  );
  fastify.get(
    "/:id/confirmation",
    { schema: { params: farmerIdParamSchema } },
    farmerConfirmationController.getConfirmation,
  );
  fastify.post(
    "/:id/confirmation-otp",
    { schema: { params: farmerIdParamSchema } },
    farmerConfirmationController.sendOtp,
  );
  fastify.post(
    "/:id/confirmation-otp/verify",
    { schema: { params: farmerIdParamSchema, body: confirmFarmerOtpBodySchema } },
    farmerConfirmationController.verifyOtp,
  );

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
