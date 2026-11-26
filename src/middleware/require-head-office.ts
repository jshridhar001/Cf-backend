import type { FastifyReply, FastifyRequest } from "fastify";
import { isHeadOfficeRole } from "@/lib/roles.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function requireHeadOffice(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) {
    return;
  }

  if (!isHeadOfficeRole(request.user?.role)) {
    return reply.code(403).send({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Head office access required",
      },
    });
  }
}

const READ_METHODS = new Set(["GET", "HEAD"]);

export async function requireMasterAccess(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) {
    return;
  }

  if (READ_METHODS.has(request.method.toUpperCase())) {
    return;
  }

  if (!isHeadOfficeRole(request.user?.role)) {
    return reply.code(403).send({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Head office access required",
      },
    });
  }
}
