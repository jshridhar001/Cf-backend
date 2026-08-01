import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createDispatchSchema,
  updateDispatchStatusSchema,
} from "@/features/seed-dispatch/seed-dispatch.schema.js";
import { seedDispatchService } from "@/features/seed-dispatch/seed-dispatch.service.js";

export const seedDispatchController = {
  async createDispatch(req: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = createDispatchSchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) {
        return reply.code(401).send({ success: false, message: "Unauthorized" });
      }

      const result = await seedDispatchService.createDispatch(payload, userId);
      return reply.code(201).send({ success: true, data: result });
    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  },

  async getDispatches(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await seedDispatchService.getAllDispatches();
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      return reply.code(500).send({ success: false, message: error.message });
    }
  },

  async getDispatchById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = req.params;
      const result = await seedDispatchService.getDispatchById(id);
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      if (error.message === "Dispatch not found") {
        return reply.code(404).send({ success: false, message: error.message });
      }
      return reply.code(500).send({ success: false, message: error.message });
    }
  },

  async markAsNull(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = req.params;
      const result = await seedDispatchService.markDispatchAsNull(id);
      return reply.send({
        success: true,
        message: "Dispatch successfully nullified",
        data: result,
      });
    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  },

  async updateStatus(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = req.params;
      const payload = updateDispatchStatusSchema.parse(req.body);

      const result = await seedDispatchService.updateStatus(id, payload.status, payload.remarks);
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      return reply.code(400).send({ success: false, message: error.message });
    }
  },
};
