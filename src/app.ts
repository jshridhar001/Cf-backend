import cors from "@fastify/cors";
import { fromNodeHeaders } from "better-auth/node";
import { config } from "dotenv";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { adminRoutes } from "./features/access-control/admin.routes.js";
import { dehaulmingRoutes } from "./features/dehaulming/dehaulming.routes.js";
import { farmerRoutes } from "./features/farmers/farmers.routes.js";
import { fieldRoutes } from "./features/fields/fields.route.js";
import { harvestRoutes } from "./features/harvest/harvest.routes.js";
import { irrigationRoutes } from "./features/irrigation/irrigation.routes.js";
import { masterRoutes } from "./features/master/master.routes.js";
import { plantationRoutes } from "./features/plantation/plantation.routes.js";
import { rougingRoutes } from "./features/rouging/rouging.routes.js";
import { lotReceiptRoutes } from "./features/seed-dispatch/lot-receipt.routes.js";
import { seedDispatchRoutes } from "./features/seed-dispatch/seed-dispatch.routes.js";
import { seedRequisitionRoutes } from "./features/seed-requisition/seed-requisition.routes.js";
import { stripTestRoutes } from "./features/strip-test/strip-test.routes.js";
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
  await fastify.register(masterRoutes, { prefix: "/api/v1/masters" });
  await fastify.register(farmerRoutes, { prefix: "/api/v1/farmers" });
  await fastify.register(fieldRoutes, { prefix: "/api/v1/fields" });
  await fastify.register(plantationRoutes, { prefix: "/api/v1/plantations" });
  await fastify.register(irrigationRoutes, { prefix: "/api/v1/irrigations" });
  await fastify.register(rougingRoutes, { prefix: "/api/v1/rougings" });
  await fastify.register(stripTestRoutes, { prefix: "/api/v1/strip-tests" });
  await fastify.register(dehaulmingRoutes, { prefix: "/api/v1/dehaulmings" });
  await fastify.register(harvestRoutes, { prefix: "/api/v1/harvests" });
  await fastify.register(seedRequisitionRoutes, { prefix: "/api/v1/seed-requisitions" });
  await fastify.register(seedDispatchRoutes, { prefix: "/api/v1/seed-dispatches" });
  await fastify.register(lotReceiptRoutes, { prefix: "/api/dispatch-lots" });

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
