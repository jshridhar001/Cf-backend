import { z } from "zod";

export const CONTRACT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_CONTRACT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const googleDriveCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export type GoogleDriveCallbackQuery = z.infer<typeof googleDriveCallbackQuerySchema>;
