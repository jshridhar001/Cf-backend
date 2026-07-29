import type { FastifyReply, FastifyRequest } from "fastify";
import { isAdminRole } from "../lib/roles.js";
import { requireAuth } from "./require-auth.js";

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) {
    return;
  }

  if (!isAdminRole(request.user?.role)) {
    return reply.code(403).send({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Admin access required",
      },
    });
  }
}
