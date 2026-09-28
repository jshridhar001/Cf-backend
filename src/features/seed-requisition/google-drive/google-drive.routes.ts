import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";
import {
  connectGoogleDrive,
  googleDriveCallback,
  uploadEnglishContract,
  uploadHindiContract,
} from "@/features/seed-requisition/google-drive/google-drive.controller.js";
import {
  CONTRACT_UPLOAD_MAX_BYTES,
  googleDriveCallbackQuerySchema,
} from "@/features/seed-requisition/google-drive/google-drive.schema.js";
import { seedRequisitionIdParamSchema } from "@/features/seed-requisition/seed-requisition.schema.js";
import { requireHeadOffice } from "@/middleware/require-head-office.js";

export async function googleDriveOAuthRoutes(fastify: FastifyInstance) {
  fastify.get("/connect", { preHandler: requireHeadOffice }, connectGoogleDrive);

  fastify.get(
    "/callback",
    { schema: { querystring: googleDriveCallbackQuerySchema } },
    googleDriveCallback,
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
    "/:id/upload",
    { schema: { params: seedRequisitionIdParamSchema } },
    uploadEnglishContract,
  );

  fastify.post(
    "/:id/upload-hindi",
    { schema: { params: seedRequisitionIdParamSchema } },
    uploadHindiContract,
  );
}
