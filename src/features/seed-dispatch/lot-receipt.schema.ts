import { z } from "zod";

export const lotIdParamSchema = z.object({
  lotId: z.string().uuid("Invalid lot id"),
});

export const confirmLotReceiptBodySchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit OTP"),
});

export type LotIdParam = z.infer<typeof lotIdParamSchema>;
export type ConfirmLotReceiptBody = z.infer<typeof confirmLotReceiptBodySchema>;
