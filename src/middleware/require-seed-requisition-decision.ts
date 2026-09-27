import type { FastifyReply, FastifyRequest } from "fastify";
import { isSeedRequisitionDecisionRole } from "@/lib/roles.js";
import { requireAuth } from "@/middleware/require-auth.js";

export async function requireSeedRequisitionDecision(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) {
    return;
  }

  if (!isSeedRequisitionDecisionRole(request.user?.role)) {
    return reply.code(403).send({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Seed requisition decision access required",
      },
    });
  }
}
