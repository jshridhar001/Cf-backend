import cors from "@fastify/cors";
import { fromNodeHeaders } from "better-auth/node";
import { config } from "dotenv";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { adminRoutes } from "./features/access-control/admin.routes.js";
import { coldStorageGatePassRoutes } from "./features/cold-storage-gate-pass/cold-storage-gate-pass.routes.js";
import { dehaulmingRoutes } from "./features/dehaulming/dehaulming.routes.js";
import { farmerRoutes } from "./features/farmers/farmer.routes.js";
import { fieldTaskRoutes } from "./features/field-task/field-task.routes.js";
import { fieldVisitRoutes } from "./features/field-visit/field-visit.routes.js";
import { fieldRoutes } from "./features/fields/fields.routes.js";
import { irrigationRoutes } from "./features/irrigation/irrigation.routes.js";
import { masterRoutes } from "./features/master/master.routes.js";
import { plantationRoutes } from "./features/plantation/plantation.routes.js";
import { rougingRoutes } from "./features/rouging/rouging.routes.js";
import { seedDispatchRoutes } from "./features/seed-dispatch/seed-dispatch.routes.js";
import { googleDriveOAuthRoutes } from "./features/seed-requisition/google-drive/google-drive.routes.js";
import { seedRequisitionRoutes } from "./features/seed-requisition/seed-requisition.routes.js";
import { stockTransferRoutes } from "./features/stock-transfer/stock-transfer.routes.js";
import { stripTestGroupRoutes } from "./features/strip-test/strip-test.routes.js";
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
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "b3", "traceparent"],
    exposedHeaders: ["set-auth-token"],
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
  await fastify.register(farmerRoutes, { prefix: "/api/v1/farmers" });
  await fastify.register(fieldRoutes, { prefix: "/api/v1/fields" });
  await fastify.register(plantationRoutes, { prefix: "/api/v1/plantations" });
  await fastify.register(fieldTaskRoutes, { prefix: "/api/v1/field-tasks" });
  await fastify.register(irrigationRoutes, { prefix: "/api/v1/irrigations" });
  await fastify.register(dehaulmingRoutes, { prefix: "/api/v1/dehaulmings" });
  await fastify.register(fieldVisitRoutes, { prefix: "/api/v1/field-visits" });
  await fastify.register(rougingRoutes, { prefix: "/api/v1/rougings" });
  await fastify.register(stripTestGroupRoutes, { prefix: "/api/v1/strip-test-groups" });
  await fastify.register(masterRoutes, { prefix: "/api/v1/masters" });
  await fastify.register(googleDriveOAuthRoutes, {
    prefix: "/api/v1/seed-requisitions/google-drive",
  });
  await fastify.register(seedRequisitionRoutes, { prefix: "/api/v1/seed-requisitions" });
  await fastify.register(seedDispatchRoutes, { prefix: "/api/v1/seed-dispatches" });
  await fastify.register(coldStorageGatePassRoutes, {
    prefix: "/api/v1/cold-storage-gate-passes",
  });
  await fastify.register(stockTransferRoutes, { prefix: "/api/v1/stock-transfers" });

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
