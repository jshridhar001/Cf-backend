import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import cors from "@fastify/cors";
import { config } from "dotenv";

// TODO: Import your feature-based routes here later (e.g., accessControlRoutes, masterRoutes)

config();

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

  // Register CORS (Crucial for your Vite SPA to communicate with this API)
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true, // Required for Better Auth session cookies to pass through
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // --- Register Plugins & Routes Below ---

  // TODO: Register Better Auth adapter here

  // TODO: Register your Contract Farming modules here
  // await fastify.register(accessControlRoutes, { prefix: "/api/v1/access-control" });
  // await fastify.register(masterRoutes, { prefix: "/api/v1/masters" });

  // ---------------------------------------

  // Health check endpoint (Updated for Bhatti Agritech)
  fastify.get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Bhatti-Agritech-Contract-Farming-Service",
  }));

  // Global error handler
  fastify.setErrorHandler(
    (error: Error, _request: FastifyRequest, reply: FastifyReply) => {
      fastify.log.error(error, "Unhandled error");
      void reply.code(500).send({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "An unexpected error occurred",
        },
      });
    }
  );

  return fastify;
};
