import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  BanUserBody,
  BulkDeleteUsersBody,
  CreateUserBody,
  EditUserBody,
  UserIdParam,
} from "@/features/access-control/admin.schema.js";
import * as adminService from "@/features/access-control/admin.service.js";

export async function getUsers(_request: FastifyRequest, reply: FastifyReply) {
  const users = await adminService.fetchUsers();
  return reply.send({ success: true, data: users });
}

export async function getSessions(_request: FastifyRequest, reply: FastifyReply) {
  const sessions = await adminService.fetchSessions();
  return reply.send({ success: true, data: sessions });
}

export async function createUser(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply,
) {
  const newUser = await adminService.createUser(request.body);
  return reply.status(201).send({ success: true, data: newUser });
}

export async function editUser(
  request: FastifyRequest<{ Params: UserIdParam; Body: EditUserBody }>,
  reply: FastifyReply,
) {
  const updatedUser = await adminService.updateUser(request.params.userId, request.body);
  if (!updatedUser) {
    return reply
      .status(403)
      .send({ success: false, error: "Cannot modify this user or user not found" });
  }
  return reply.send({ success: true, data: updatedUser });
}

export async function banUser(
  request: FastifyRequest<{ Params: UserIdParam; Body: BanUserBody }>,
  reply: FastifyReply,
) {
  const bannedUser = await adminService.banUser(request.params.userId, request.body);
  if (!bannedUser) {
    return reply.status(403).send({ success: false, error: "Cannot ban this user" });
  }
  return reply.send({ success: true, data: bannedUser });
}

export async function deleteUser(
  request: FastifyRequest<{ Params: UserIdParam }>,
  reply: FastifyReply,
) {
  const deleted = await adminService.deleteUser(request.params.userId);
  if (!deleted) {
    return reply.status(403).send({ success: false, error: "Cannot delete this user" });
  }
  return reply.send({ success: true, message: "User deleted successfully" });
}

export async function deleteUsersBulk(
  request: FastifyRequest<{ Body: BulkDeleteUsersBody }>,
  reply: FastifyReply,
) {
  const deletedCount = await adminService.bulkDeleteUsers(request.body.userIds);
  return reply.send({ success: true, message: `Successfully deleted ${deletedCount} users` });
}

export async function deleteAllSessions(request: FastifyRequest, reply: FastifyReply) {
  await adminService.clearAllSessions(request.user?.id);
  return reply.send({ success: true, message: "All other sessions have been revoked" });
}
