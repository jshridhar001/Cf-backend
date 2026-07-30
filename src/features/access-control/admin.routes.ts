import type { FastifyInstance } from "fastify";
import { requireHeadOffice } from "../../middleware/require-head-office.js";
import * as adminController from "./admin.controller.js";
import {
  banUserBodySchema,
  bulkDeleteUsersBodySchema,
  createUserBodySchema,
  editUserBodySchema,
  userIdParamSchema,
} from "./admin.schema.js";

export async function adminRoutes(fastify: FastifyInstance) {
  // SUPER_DEVELOPER | MANAGING_DIRECTOR | PROGRAMME_MANAGER
  fastify.addHook("preHandler", requireHeadOffice);

  // --- READ ---
  fastify.get("/users", adminController.getUsers);
  fastify.get("/sessions", adminController.getSessions);

  // --- CREATE ---
  fastify.post(
    "/users",
    {
      schema: { body: createUserBodySchema },
    },
    adminController.createUser,
  );

  // --- UPDATE ---
  fastify.patch(
    "/users/:userId",
    {
      schema: { params: userIdParamSchema, body: editUserBodySchema },
    },
    adminController.editUser,
  );

  // --- ACTION: BAN USER ---
  fastify.post(
    "/users/:userId/ban",
    {
      schema: { params: userIdParamSchema, body: banUserBodySchema },
    },
    adminController.banUser,
  );

  // --- DELETE ---
  fastify.delete(
    "/users/:userId",
    {
      schema: { params: userIdParamSchema },
    },
    adminController.deleteUser,
  );

  fastify.delete(
    "/users/bulk",
    {
      schema: { body: bulkDeleteUsersBodySchema },
    },
    adminController.deleteUsersBulk,
  );

  fastify.delete("/sessions/bulk", adminController.deleteAllSessions);
}
