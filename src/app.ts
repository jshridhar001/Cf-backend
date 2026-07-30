import cors from "@fastify/cors";
import { fromNodeHeaders } from "better-auth/node";
import { config } from "dotenv";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { adminRoutes } from "./features/access-control/admin.routes.js";
import { auth } from "./lib/auth.js";
import { authPlugin } from "./plugins/auth.js";

config();

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

export const buildApp = async (): Promise<FastifyInstance> => {
  const isDev = process.env.NODE_ENV === "development";

  const fastify: FastifyInstance = Fastify({
    logger: isDev
      ? {
          level: process.env.LOG_LEVEL || "info",
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          },
        }
      : {
          level: process.env.LOG_LEVEL || "info",
        },
  });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || clientOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400,
  });

  await fastify.register(authPlugin);

  fastify.get("/api/me", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.status(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Unauthorized" },
      });
    }

    return reply.send(session);
  });

  await fastify.register(adminRoutes, { prefix: "/api/v1/access-control" });

  // TODO: Register Contract Farming modules here
  // await fastify.register(masterRoutes, { prefix: "/api/v1/masters" });

  fastify.get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Bhatti-Agritech-Contract-Farming-Service",
  }));

  fastify.setErrorHandler((error: Error, _request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.error(error, "Unhandled error");
    void reply.code(500).send({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
    });
  });

  return fastify;
};
