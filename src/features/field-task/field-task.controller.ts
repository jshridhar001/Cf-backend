import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  FieldTaskIdParam,
  FieldTaskOfficerParam,
  ListFieldTaskQuery,
} from "@/features/field-task/field-task.schema.js";
import { fieldTasksService } from "@/features/field-task/field-task.service.js";

export async function getAllFieldTasks(
  request: FastifyRequest<{ Querystring: ListFieldTaskQuery }>,
  reply: FastifyReply,
) {
  const data = await fieldTasksService.getAllFieldTasks(request.query);
  return reply.send({ success: true, data });
}

export async function getFieldTasksByOfficer(
  request: FastifyRequest<{ Params: FieldTaskOfficerParam }>,
  reply: FastifyReply,
) {
  const data = await fieldTasksService.getFieldTasksByOfficer(request.params.assignedOfficerId);
  return reply.send({ success: true, data });
}

export async function getFieldTaskById(
  request: FastifyRequest<{ Params: FieldTaskIdParam }>,
  reply: FastifyReply,
) {
  const data = await fieldTasksService.getFieldTaskById(request.params.id);

  if (!data) {
    return reply.status(404).send({ success: false, error: "Field task not found." });
  }

  return reply.send({ success: true, data });
}
