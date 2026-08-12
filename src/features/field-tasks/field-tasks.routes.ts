import type { FastifyInstance } from "fastify";
import {
  getAllTasksHandler,
  getOfficerTasksHandler,
  getTaskSummaryHandler,
} from "@/features/field-tasks/field-tasks.controller.js";
import {
  officerIdParamSchema,
  taskSummaryQuerySchema,
} from "@/features/field-tasks/field-tasks.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function fieldTasksRoutes(fastify: FastifyInstance) {
  // Head-office monitoring
  await fastify.register(async (headOfficeScope) => {
    headOfficeScope.addHook("preHandler", requireHeadOffice);

    headOfficeScope.get("/", getAllTasksHandler);

    headOfficeScope.get(
      "/task-summary",
      { schema: { querystring: taskSummaryQuerySchema } },
      getTaskSummaryHandler,
    );
  });

  // Field officer (own tasks) + head office (any officer)
  await fastify.register(async (authScope) => {
    authScope.addHook("preHandler", requireAuth);

    authScope.get(
      "/officer/:officerId",
      { schema: { params: officerIdParamSchema } },
      getOfficerTasksHandler,
    );
  });
}
