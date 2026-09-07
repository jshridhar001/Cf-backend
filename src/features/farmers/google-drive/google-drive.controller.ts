import type { FastifyReply, FastifyRequest } from "fastify";
import type { FarmerContractIdParam } from "@/features/farmers/farmers.schema.js";
import {
  CONTRACT_UPLOAD_MAX_BYTES,
  type GoogleDriveCallbackQuery,
} from "@/features/farmers/google-drive/google-drive.schema.js";
import { googleDriveService } from "@/features/farmers/google-drive/google-drive.service.js";

function isFileTooLarge(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; statusCode?: number };
  return err.code === "FST_REQ_FILE_TOO_LARGE" || err.statusCode === 413;
}

export class GoogleDriveController {
  static async connect(_request: FastifyRequest, reply: FastifyReply) {
    const state = googleDriveService.createOAuthState();
    const url = googleDriveService.getAuthUrl(state);
    return reply.redirect(url);
  }

  static async callback(
    request: FastifyRequest<{ Querystring: GoogleDriveCallbackQuery }>,
    reply: FastifyReply,
  ) {
    const { code, state, error } = request.query;

    if (error) {
      return reply.status(400).send({ success: false, error: `Google OAuth error: ${error}` });
    }
    if (!code || !state) {
      return reply.status(400).send({ success: false, error: "Missing OAuth code or state." });
    }
    if (!googleDriveService.verifyOAuthState(state)) {
      return reply.status(400).send({ success: false, error: "Invalid or expired OAuth state." });
    }

    const refreshToken = await googleDriveService.exchangeCode(code);
    return reply.send({
      success: true,
      refreshToken,
      message:
        "GOOGLE_DRIVE_REFRESH_TOKEN was saved to .env. Retry the contract upload; restart the server if it still fails.",
    });
  }

  static async uploadContractDocument(
    request: FastifyRequest<{ Params: FarmerContractIdParam }>,
    reply: FastifyReply,
  ) {
    try {
      const uploaded = await request.file();
      if (!uploaded) {
        return reply.status(400).send({ success: false, error: "File is required." });
      }

      const buffer = await uploaded.toBuffer();
      if (uploaded.file.truncated || buffer.length > CONTRACT_UPLOAD_MAX_BYTES) {
        return reply.status(400).send({ success: false, error: "File exceeds the 10MB limit." });
      }

      const result = await googleDriveService.uploadContractDocument(
        request.params.id,
        request.params.contractId,
        {
          filename: uploaded.filename,
          mimetype: uploaded.mimetype,
          buffer,
        },
      );

      if (result.status === "farmer_not_found") {
        return reply.status(404).send({ success: false, error: "Farmer not found." });
      }
      if (result.status === "contract_not_found") {
        return reply.status(404).send({ success: false, error: "Contract not found." });
      }
      if (result.status === "invalid_file") {
        return reply.status(400).send({ success: false, error: result.error });
      }

      return reply.send({ success: true, data: result.contract });
    } catch (error: unknown) {
      if (isFileTooLarge(error)) {
        return reply.status(400).send({ success: false, error: "File exceeds the 10MB limit." });
      }
      throw error;
    }
  }
}
