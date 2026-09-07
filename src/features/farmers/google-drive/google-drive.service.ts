import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { type drive_v3, google } from "googleapis";
import { farmersService } from "@/features/farmers/farmers.service.js";
import {
  ALLOWED_CONTRACT_MIME_TYPES,
  CONTRACT_UPLOAD_MAX_BYTES,
} from "@/features/farmers/google-drive/google-drive.schema.js";

const DRIVE_FILE_ID_RE = /\/d\/([a-zA-Z0-9_-]+)/;
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type ContractUploadFile = {
  filename: string;
  mimetype: string;
  buffer: Buffer;
};

function getOAuthClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Google Drive OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.",
    );
  }

  return { clientId, clientSecret, redirectUri };
}

function createOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getOAuthClientConfig();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function persistRefreshToken(refreshToken: string) {
  process.env.GOOGLE_DRIVE_REFRESH_TOKEN = refreshToken;

  if (process.env.NODE_ENV === "production") return;

  const envPath = path.resolve(process.cwd(), ".env");
  const current = readFileSync(envPath, "utf8");
  const line = `GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}`;
  const next = /^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m.test(current)
    ? current.replace(/^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m, line)
    : `${current.trimEnd()}\n${line}\n`;
  writeFileSync(envPath, next);
}

function getStateSecret() {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET or GOOGLE_CLIENT_SECRET is required to sign OAuth state.");
  }
  return secret;
}

function getDriveClient(): { drive: drive_v3.Drive; folderId: string } {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const missing: string[] = [];
  if (!folderId) missing.push("GOOGLE_DRIVE_FOLDER_ID");
  if (!refreshToken) missing.push("GOOGLE_DRIVE_REFRESH_TOKEN");

  if (!folderId || !refreshToken) {
    throw new Error(
      `Google Drive is not configured. Set ${missing.join(" and ")}. If GOOGLE_DRIVE_REFRESH_TOKEN is missing, call GET /api/v1/farmers/google-drive/connect as head office, then paste the returned refreshToken into .env and restart.`,
    );
  }

  const auth = createOAuthClient();
  auth.setCredentials({ refresh_token: refreshToken });

  return { drive: google.drive({ version: "v3", auth }), folderId };
}

function parseDriveFileId(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.match(DRIVE_FILE_ID_RE)?.[1];
}

function safeFileName(original: string) {
  const base = path
    .basename(original)
    .replace(/[^\w.\-()+ ]+/g, "_")
    .trim();
  return base || "document";
}

function validateFile(file: ContractUploadFile): string | undefined {
  if (!file.buffer.length) {
    return "File is empty.";
  }
  if (file.buffer.length > CONTRACT_UPLOAD_MAX_BYTES) {
    return "File exceeds the 10MB limit.";
  }
  if (!ALLOWED_CONTRACT_MIME_TYPES.has(file.mimetype)) {
    return "File type must be PDF, JPEG, PNG, or WebP.";
  }
  return undefined;
}

async function deleteDriveFile(drive: drive_v3.Drive, fileId: string) {
  try {
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
  } catch {
    // Previous file may already be gone; replacement should still proceed.
  }
}

async function uploadToDrive(
  drive: drive_v3.Drive,
  folderId: string,
  name: string,
  mimetype: string,
  buffer: Buffer,
) {
  const created = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
    },
    media: {
      mimeType: mimetype,
      body: Readable.from(buffer),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const fileId = created.data.id;
  if (!fileId) {
    throw new Error("Google Drive did not return a file id.");
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
    supportsAllDrives: true,
  });

  const meta = await drive.files.get({
    fileId,
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  return meta.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`;
}

export const googleDriveService = {
  createOAuthState() {
    const issuedAt = Date.now().toString();
    const nonce = randomBytes(16).toString("hex");
    const payload = `${issuedAt}.${nonce}`;
    const signature = createHmac("sha256", getStateSecret()).update(payload).digest("hex");
    return Buffer.from(`${payload}.${signature}`).toString("base64url");
  },

  verifyOAuthState(state: string) {
    try {
      const decoded = Buffer.from(state, "base64url").toString("utf8");
      const lastDot = decoded.lastIndexOf(".");
      if (lastDot === -1) return false;

      const payload = decoded.slice(0, lastDot);
      const signature = decoded.slice(lastDot + 1);
      const expected = createHmac("sha256", getStateSecret()).update(payload).digest("hex");
      if (signature.length !== expected.length) return false;
      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

      const issuedAt = Number(payload.split(".")[0]);
      if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > OAUTH_STATE_TTL_MS) return false;
      return true;
    } catch {
      return false;
    }
  },

  getAuthUrl(state: string) {
    const auth = createOAuthClient();
    return auth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [DRIVE_SCOPE],
      state,
    });
  },

  async exchangeCode(code: string) {
    const auth = createOAuthClient();
    const { tokens } = await auth.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error(
        "Google did not return a refresh token. Reconnect with prompt=consent using the shared Google account.",
      );
    }
    persistRefreshToken(tokens.refresh_token);
    return tokens.refresh_token;
  },

  async uploadContractDocument(farmerId: string, contractId: string, file: ContractUploadFile) {
    const fileError = validateFile(file);
    if (fileError) {
      return { status: "invalid_file", error: fileError } as const;
    }

    const lookup = await farmersService.getFarmerContract(farmerId, contractId);
    if (!lookup.farmerFound) {
      return { status: "farmer_not_found" } as const;
    }
    if (!lookup.contract) {
      return { status: "contract_not_found" } as const;
    }

    const { drive, folderId } = getDriveClient();
    const previousFileId = parseDriveFileId(lookup.contract.contractUrl);
    if (previousFileId) {
      await deleteDriveFile(drive, previousFileId);
    }

    const contractUrl = await uploadToDrive(
      drive,
      folderId,
      `${contractId}-${safeFileName(file.filename)}`,
      file.mimetype,
      file.buffer,
    );

    const contract = await farmersService.updateFarmerContract(farmerId, contractId, {
      contractUrl,
    });
    if (!contract) {
      return { status: "contract_not_found" } as const;
    }

    return { status: "ok", contract } as const;
  },
};
