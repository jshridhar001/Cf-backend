import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  OfficerIdParam,
  TaskSummaryQuery,
} from "@/features/field-tasks/field-tasks.schema.js";
import * as fieldTasksService from "@/features/field-tasks/field-tasks.service.js";
import { isHeadOfficeRole } from "@/lib/roles.js";

export async function getTaskSummaryHandler(
  request: FastifyRequest<{ Querystring: TaskSummaryQuery }>,
  reply: FastifyReply,
) {
  const summary = await fieldTasksService.getTaskSummary(request.query);
  return reply.send({ success: true, data: summary });
}

export async function getOfficerTasksHandler(
  request: FastifyRequest<{ Params: OfficerIdParam }>,
  reply: FastifyReply,
) {
  const requesterId = request.user?.id;
  if (!requesterId) {
    return reply.code(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  const { officerId } = request.params;
  if (!isHeadOfficeRole(request.user?.role) && officerId !== requesterId) {
    return reply.code(403).send({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You can only view your own tasks",
      },
    });
  }

  const tasks = await fieldTasksService.getOfficerTasks(officerId);
  return reply.send({ success: true, data: tasks });
}
