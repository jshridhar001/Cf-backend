export const LOT_RECEIPT_OTP_PURPOSE = "lot-receipt";
export const TRANSFER_RECEIPT_OTP_PURPOSE = "transfer-receipt";

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_RESEND_COOLDOWN_SECONDS = 45;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_INVALID_MESSAGE = "Invalid or expired OTP.";

export type SendOtpInput = {
  purpose: string;
  referenceId: string;
  mobileNumber: string;
};

export type SendOtpResult = {
  /** Only while using mock SMS — omit in real SMS provider. */
  devOtp?: string;
};

export type VerifyOtpInput = {
  purpose: string;
  referenceId: string;
  mobileNumber: string;
  code: string;
};

export type VerifyOtpResult = { ok: true } | { ok: false; error: string };

export type OtpProvider = {
  sendOtp: (input: SendOtpInput) => Promise<SendOtpResult>;
  verifyOtp: (input: VerifyOtpInput) => Promise<VerifyOtpResult>;
};
