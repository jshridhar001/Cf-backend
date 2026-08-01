import type { FastifyInstance } from "fastify";
import { seedDispatchController } from "@/features/seed-dispatch/seed-dispatch.controller.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function seedDispatchRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  fastify.post("/", seedDispatchController.createDispatch);
  fastify.get("/", seedDispatchController.getDispatches);
  fastify.get("/:id", seedDispatchController.getDispatchById);
  fastify.patch("/:id/nullify", seedDispatchController.markAsNull);
  fastify.patch("/:id/status", seedDispatchController.updateStatus);
}
