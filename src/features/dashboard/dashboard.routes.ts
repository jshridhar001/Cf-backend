import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as dashboardController from "@/features/dashboard/dashboard.controller.js";
import { dailyActivityQuerySchema } from "@/features/dashboard/dashboard.schema.js";
import { requireDashboardAccess } from "@/middleware/require-dashboard-access.js";

export const dashboardRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/daily-activity",
    {
      preHandler: requireDashboardAccess,
      schema: { querystring: dailyActivityQuerySchema },
    },
    dashboardController.getDailyActivityReport,
  );
};
