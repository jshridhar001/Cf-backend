export const LOT_RECEIPT_OTP_PURPOSE = "lot-receipt";
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_TTL_SECONDS = 300;

type OtpRecord = {
  code: string;
  mobileNumber: string;
  expiresAt: number;
};

const otpStore = new Map<string, OtpRecord>();

function otpKey(purpose: string, referenceId: string) {
  return `${purpose}:${referenceId}`;
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getOtpProvider() {
  return {
    async sendOtp(input: { purpose: string; referenceId: string; mobileNumber: string }) {
      const code = randomOtp();
      otpStore.set(otpKey(input.purpose, input.referenceId), {
        code,
        mobileNumber: input.mobileNumber,
        expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
      });

      return {
        devOtp: process.env.NODE_ENV === "development" ? code : undefined,
      };
    },

    async verifyOtp(input: {
      purpose: string;
      referenceId: string;
      mobileNumber: string;
      code: string;
    }) {
      const record = otpStore.get(otpKey(input.purpose, input.referenceId));
      if (!record || record.expiresAt < Date.now()) {
        return { ok: false as const, error: "OTP has expired. Request a new one." };
      }

      if (record.mobileNumber !== input.mobileNumber || record.code !== input.code) {
        return { ok: false as const, error: "Invalid OTP." };
      }

      otpStore.delete(otpKey(input.purpose, input.referenceId));
      return { ok: true as const };
    },
  };
}
