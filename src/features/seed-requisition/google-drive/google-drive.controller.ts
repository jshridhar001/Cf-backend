import type { FastifyReply, FastifyRequest } from "fastify";
import {
  CONTRACT_UPLOAD_MAX_BYTES,
  type GoogleDriveCallbackQuery,
} from "@/features/seed-requisition/google-drive/google-drive.schema.js";
import {
  type ContractUploadFile,
  googleDriveService,
} from "@/features/seed-requisition/google-drive/google-drive.service.js";
import type { SeedRequisitionIdParam } from "@/features/seed-requisition/seed-requisition.schema.js";

function isFileTooLarge(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; statusCode?: number };
  return err.code === "FST_REQ_FILE_TOO_LARGE" || err.statusCode === 413;
}

function badRequest(reply: FastifyReply, message: string) {
  return reply.code(400).send({
    success: false,
    error: { code: "BAD_REQUEST", message },
  });
}

export async function connectGoogleDrive(_request: FastifyRequest, reply: FastifyReply) {
  const state = googleDriveService.createOAuthState();
  const url = googleDriveService.getAuthUrl(state);
  return reply.redirect(url);
}

export async function googleDriveCallback(
  request: FastifyRequest<{ Querystring: GoogleDriveCallbackQuery }>,
  reply: FastifyReply,
) {
  const { code, state, error } = request.query;

  if (error) {
    return badRequest(reply, `Google OAuth error: ${error}`);
  }
  if (!code || !state) {
    return badRequest(reply, "Missing OAuth code or state.");
  }
  if (!googleDriveService.verifyOAuthState(state)) {
    return badRequest(reply, "Invalid or expired OAuth state.");
  }

  const refreshToken = await googleDriveService.exchangeCode(code);
  return reply.send({
    success: true,
    data: { refreshToken },
    message:
      "GOOGLE_DRIVE_REFRESH_TOKEN was saved to .env. Retry the contract upload; restart the server if it still fails.",
  });
}

export async function uploadEnglishContract(
  request: FastifyRequest<{ Params: SeedRequisitionIdParam }>,
  reply: FastifyReply,
) {
  return handleContractUpload(request, reply, googleDriveService.uploadEnglishContract);
}

export async function uploadHindiContract(
  request: FastifyRequest<{ Params: SeedRequisitionIdParam }>,
  reply: FastifyReply,
) {
  return handleContractUpload(request, reply, googleDriveService.uploadHindiContract);
}

async function handleContractUpload(
  request: FastifyRequest<{ Params: SeedRequisitionIdParam }>,
  reply: FastifyReply,
  upload: (
    requisitionId: string,
    file: ContractUploadFile,
  ) => ReturnType<typeof googleDriveService.uploadEnglishContract>,
) {
  try {
    const uploaded = await request.file();
    if (!uploaded) {
      return badRequest(reply, "File is required.");
    }

    const buffer = await uploaded.toBuffer();
    if (uploaded.file.truncated || buffer.length > CONTRACT_UPLOAD_MAX_BYTES) {
      return badRequest(reply, "File exceeds the 10MB limit.");
    }

    const result = await upload(request.params.id, {
      filename: uploaded.filename,
      mimetype: uploaded.mimetype,
      buffer,
    });

    if (result.status === "not_found") {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Seed requisition not found" },
      });
    }
    if (result.status === "invalid_file") {
      return badRequest(reply, result.error);
    }

    return reply.send({ success: true, data: result.requisition });
  } catch (error: unknown) {
    if (isFileTooLarge(error)) {
      return badRequest(reply, "File exceeds the 10MB limit.");
    }
    throw error;
  }
}
