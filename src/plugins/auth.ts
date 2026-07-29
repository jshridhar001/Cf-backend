import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { auth } from "../lib/auth.js";

export const authPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request: FastifyRequest, reply: FastifyReply) {
      try {
        const protocol = request.protocol;
        const host = request.headers.host || "localhost:8080";
        const url = new URL(request.url, `${protocol}://${host}`);

        const headers = fromNodeHeaders(request.headers);

        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          ...(request.body ? { body: JSON.stringify(request.body) } : {}),
        });

        const response = await auth.handler(req);

        reply.status(response.status);
        response.headers.forEach((value, key) => {
          reply.header(key, value);
        });

        const responseBody = response.body ? await response.text() : null;
        return reply.send(responseBody);
      } catch (error) {
        fastify.log.error(error, "Authentication Error");
        return reply.status(500).send({
          success: false,
          error: {
            code: "AUTH_FAILURE",
            message: "Internal authentication error",
          },
        });
      }
    },
  });
});
