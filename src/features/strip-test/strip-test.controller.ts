import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateStripTestGroupBody,
  ListStripTestGroupQuery,
  StripTestGroupIdParam,
} from "@/features/strip-test/strip-test.schema.js";
import {
  StripTestWriteError,
  stripTestGroupsService,
} from "@/features/strip-test/strip-test.service.js";
import {
  isForeignKeyViolation,
  isUniqueViolation,
  postgresConstraint,
} from "@/lib/postgres-errors.js";

const DUPLICATE_NAME = "A strip test group with this name already exists for this field.";
const INVALID_REFERENCE = "Invalid field, user, or tuber size.";

function sendStripTestWriteError(error: unknown, reply: FastifyReply) {
  if (error instanceof StripTestWriteError) {
    return reply.status(400).send({ success: false, error: error.message });
  }
  if (
    isUniqueViolation(error) &&
    postgresConstraint(error) === "unique_strip_test_group_name_per_field"
  ) {
    return reply.status(400).send({ success: false, error: DUPLICATE_NAME });
  }
  if (isForeignKeyViolation(error)) {
    return reply.status(400).send({ success: false, error: INVALID_REFERENCE });
  }
  throw error;
}

function requireUserId(request: FastifyRequest, reply: FastifyReply) {
  const createdById = request.user?.id;
  if (!createdById) {
    reply.status(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return undefined;
  }
  return createdById;
}

export async function getAllStripTestGroups(
  request: FastifyRequest<{ Querystring: ListStripTestGroupQuery }>,
  reply: FastifyReply,
) {
  const data = await stripTestGroupsService.getAllStripTestGroups(request.query.fieldId);
  return reply.send({ success: true, data });
}

export async function getStripTestGroupById(
  request: FastifyRequest<{ Params: StripTestGroupIdParam }>,
  reply: FastifyReply,
) {
  const data = await stripTestGroupsService.getStripTestGroupById(request.params.id);

  if (!data) {
    return reply.status(404).send({ success: false, error: "Strip test group not found." });
  }

  return reply.send({ success: true, data });
}

export async function createStripTestGroup(
  request: FastifyRequest<{ Body: CreateStripTestGroupBody }>,
  reply: FastifyReply,
) {
  const createdById = requireUserId(request, reply);
  if (!createdById) {
    return;
  }

  try {
    const group = await stripTestGroupsService.createStripTestGroup(request.body, createdById);
    return reply.status(201).send({ success: true, data: group });
  } catch (error) {
    return sendStripTestWriteError(error, reply);
  }
}

export async function updateStripTestGroup(
  request: FastifyRequest<{ Params: StripTestGroupIdParam; Body: CreateStripTestGroupBody }>,
  reply: FastifyReply,
) {
  const createdById = requireUserId(request, reply);
  if (!createdById) {
    return;
  }

  try {
    const group = await stripTestGroupsService.updateStripTestGroup(
      request.params.id,
      request.body,
      createdById,
    );

    if (!group) {
      return reply.status(404).send({ success: false, error: "Strip test group not found." });
    }

    return reply.send({ success: true, data: group });
  } catch (error) {
    return sendStripTestWriteError(error, reply);
  }
}

export async function deleteStripTestGroup(
  request: FastifyRequest<{ Params: StripTestGroupIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await stripTestGroupsService.deleteStripTestGroup(request.params.id);

  if (!deleted) {
    return reply.status(404).send({ success: false, error: "Strip test group not found." });
  }

  return reply.send({ success: true, message: "Strip test group deleted successfully." });
}
