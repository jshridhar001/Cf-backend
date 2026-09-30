import type { FastifyReply, FastifyRequest } from "fastify";
import type { DispatchIdParam } from "@/features/seed-dispatch/seed-dispatch.schema.js";
import { seedDispatchesService } from "@/features/seed-dispatch/seed-dispatch.service.js";

export async function getAllDispatches(_request: FastifyRequest, reply: FastifyReply) {
  const data = await seedDispatchesService.getAllDispatches();
  return reply.send({ success: true, data });
}

export async function getDispatchById(
  request: FastifyRequest<{ Params: DispatchIdParam }>,
  reply: FastifyReply,
) {
  const data = await seedDispatchesService.getDispatchById(request.params.id);

  if (!data) {
    return reply.code(404).send({
      success: false,
      error: { code: "NOT_FOUND", message: "Seed dispatch not found" },
    });
  }

  return reply.send({ success: true, data });
}
