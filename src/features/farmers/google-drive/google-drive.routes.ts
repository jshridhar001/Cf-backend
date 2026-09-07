import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import { farmerContractIdParamSchema } from "@/features/farmers/farmers.schema.js";
import { GoogleDriveController } from "@/features/farmers/google-drive/google-drive.controller.js";
import {
  CONTRACT_UPLOAD_MAX_BYTES,
  googleDriveCallbackQuerySchema,
} from "@/features/farmers/google-drive/google-drive.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function googleDriveOAuthRoutes(fastify: FastifyInstance) {
  fastify.get("/connect", { preHandler: requireHeadOffice }, GoogleDriveController.connect);

  fastify.get(
    "/callback",
    { schema: { querystring: googleDriveCallbackQuerySchema } },
    GoogleDriveController.callback,
  );
}

export async function googleDriveRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart, {
    limits: {
      fileSize: CONTRACT_UPLOAD_MAX_BYTES,
      files: 1,
    },
  });

  fastify.post(
    "/:id/contracts/:contractId/upload",
    { schema: { params: farmerContractIdParamSchema } },
    GoogleDriveController.uploadContractDocument,
  );
}
