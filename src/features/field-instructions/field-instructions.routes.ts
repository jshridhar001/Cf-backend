import type { FastifyInstance } from "fastify";
import {
  addReplyHandler,
  createInstructionHandler,
  getFieldInstructionsHandler,
  getHeadOfficeInstructionsHandler,
  getMyInstructionsHandler,
  updateInstructionStatusHandler,
} from "@/features/field-instructions/field-instructions.controller.js";
import {
  createInstructionSchema,
  createReplySchema,
  fieldIdParamSchema,
  instructionIdParamSchema,
  updateInstructionStatusSchema,
} from "@/features/field-instructions/field-instructions.schema.js";
import { requireAuth } from "@/middleware/require-auth.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function fieldInstructionRoutes(fastify: FastifyInstance) {
  // Head office: create + list all + by field
  await fastify.register(async (headOfficeScope) => {
    headOfficeScope.addHook("preHandler", requireHeadOffice);

    headOfficeScope.post(
      "/",
      { schema: { body: createInstructionSchema } },
      createInstructionHandler,
    );

    headOfficeScope.get("/", getHeadOfficeInstructionsHandler);

    headOfficeScope.get(
      "/field/:fieldId",
      { schema: { params: fieldIdParamSchema } },
      getFieldInstructionsHandler,
    );
  });

  // Authenticated: officer inbox + status updates + replies
  await fastify.register(async (authScope) => {
    authScope.addHook("preHandler", requireAuth);

    authScope.get("/my", getMyInstructionsHandler);

    authScope.patch(
      "/:instructionId/status",
      {
        schema: {
          params: instructionIdParamSchema,
          body: updateInstructionStatusSchema,
        },
      },
      updateInstructionStatusHandler,
    );

    authScope.post(
      "/:instructionId/replies",
      {
        schema: {
          params: instructionIdParamSchema,
          body: createReplySchema,
        },
      },
      addReplyHandler,
    );
  });
}
