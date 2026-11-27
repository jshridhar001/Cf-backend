import type { FastifyReply, FastifyRequest } from "fastify";
import type { DailyActivityQuery } from "@/features/dashboard/dashboard.schema.js";
import { getDailyActivity } from "@/features/dashboard/dashboard.service.js";

export async function getDailyActivityReport(
  request: FastifyRequest<{ Querystring: DailyActivityQuery }>,
  reply: FastifyReply,
) {
  const result = await getDailyActivity(request.query.from, request.query.to);
  if (!result.ok) {
    return reply.status(400).send({ success: false, error: result.error });
  }

  return reply.send({ success: true, data: result.data });
}
