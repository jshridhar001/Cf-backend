import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../lib/auth.js";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.code(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    request.user = session.user;
    request.session = session.session;
  } catch {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid or expired session" },
    });
  }
}
