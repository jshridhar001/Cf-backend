import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import * as fieldTaskController from "@/features/field-task/field-task.controller.js";
import {
  fieldTaskIdParamSchema,
  fieldTaskOfficerParamSchema,
  listFieldTaskQuerySchema,
} from "@/features/field-task/field-task.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";

export const fieldTaskRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get(
    "/",
    { schema: { querystring: listFieldTaskQuerySchema } },
    fieldTaskController.getAllFieldTasks,
  );

  fastify.get(
    "/officers/:assignedOfficerId",
    { schema: { params: fieldTaskOfficerParamSchema } },
    fieldTaskController.getFieldTasksByOfficer,
  );

  fastify.get(
    "/:id",
    { schema: { params: fieldTaskIdParamSchema } },
    fieldTaskController.getFieldTaskById,
  );
};
