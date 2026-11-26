import { z } from "zod";

export const confirmFarmerOtpBodySchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{4,9}$/, "Enter the OTP"),
});

export type ConfirmFarmerOtpBody = z.infer<typeof confirmFarmerOtpBodySchema>;
