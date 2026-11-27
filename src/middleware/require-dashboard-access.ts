import type { FastifyReply, FastifyRequest } from "fastify";
import { isDashboardRole } from "@/lib/roles.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function requireDashboardAccess(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) {
    return;
  }

  if (!isDashboardRole(request.user?.role)) {
    return reply.code(403).send({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Dashboard access required",
      },
    });
  }
}
