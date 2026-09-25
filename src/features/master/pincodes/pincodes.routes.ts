import type { FastifyInstance } from "fastify";
import * as pincodesController from "@/features/master/pincodes/pincodes.controller.js";
import {
  createPincodeBodySchema,
  pincodeIdParamSchema,
  updatePincodeBodySchema,
} from "@/features/master/pincodes/pincodes.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function pincodeRoutes(fastify: FastifyInstance) {
  // 🛡️ Apply Head Office protection to ALL routes in this plugin
  // SUPER_DEVELOPER | MANAGING_DIRECTOR | PROGRAMME_MANAGER
  fastify.addHook("preHandler", requireHeadOffice);

  // --- READ ---
  fastify.get("/", pincodesController.getAllPincodes);

  // --- CREATE ---
  fastify.post(
    "/",
    {
      schema: { body: createPincodeBodySchema },
    },
    pincodesController.createPincode,
  );

  // --- UPDATE ---
  fastify.put(
    "/:id",
    {
      schema: { params: pincodeIdParamSchema, body: updatePincodeBodySchema },
    },
    pincodesController.updatePincode,
  );

  // --- DELETE SINGLE ---
  fastify.delete(
    "/:id",
    {
      schema: { params: pincodeIdParamSchema },
    },
    pincodesController.deletePincode,
  );

  // --- DELETE ALL (DANGER ⚠️) ---
  fastify.delete("/all", pincodesController.deleteAllPincodes);
}
