import type { FastifyInstance } from "fastify";
import {
  createRequisitionHandler,
  deleteAllRequisitionsHandler,
  deleteRequisitionHandler,
  getAllRequisitionsHandler,
  getRequisitionByIdHandler,
  reviewRequisitionHandler,
  updateRequisitionHandler,
} from "@/features/seed-requisition/seed-requisition.controller.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function seedRequisitionRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  // Core CRUD
  fastify.post("/", createRequisitionHandler);
  fastify.get("/", getAllRequisitionsHandler);
  fastify.get("/:id", getRequisitionByIdHandler);
  fastify.patch("/:id", updateRequisitionHandler);

  // Dedicated Review Route (Approval/Rejection)
  fastify.patch("/:id/review", reviewRequisitionHandler);

  // Destructive Actions
  fastify.delete("/:id", deleteRequisitionHandler);
  fastify.delete("/", deleteAllRequisitionsHandler);
}
