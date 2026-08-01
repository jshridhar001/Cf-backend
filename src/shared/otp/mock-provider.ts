import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { otpChallenges } from "@/db/schema/otp-challenge.js";
import { hashOtp, safeEqualHash } from "@/shared/otp/hash.js";
import {
  OTP_INVALID_MESSAGE,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  type OtpProvider,
  type SendOtpInput,
  type SendOtpResult,
  type VerifyOtpInput,
  type VerifyOtpResult,
} from "@/shared/otp/types.js";

export function createMockOtpProvider(): OtpProvider {
  return {
    async sendOtp(input: SendOtpInput): Promise<SendOtpResult> {
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      const codeHash = hashOtp(code);
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);

      await db
        .delete(otpChallenges)
        .where(
          and(
            eq(otpChallenges.purpose, input.purpose),
            eq(otpChallenges.referenceId, input.referenceId),
          ),
        );

      await db.insert(otpChallenges).values({
        purpose: input.purpose,
        referenceId: input.referenceId,
        mobileNumber: input.mobileNumber,
        codeHash,
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        expiresAt,
      });

      if (process.env.NODE_ENV !== "production") {
        console.info(
          `[mock-otp] purpose=${input.purpose} referenceId=${input.referenceId} code=${code}`,
        );
      }

      return { devOtp: code };
    },

    async verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResult> {
      const challenge = await db.query.otpChallenges.findFirst({
        where: and(
          eq(otpChallenges.purpose, input.purpose),
          eq(otpChallenges.referenceId, input.referenceId),
        ),
      });

      if (!challenge) {
        return { ok: false, error: OTP_INVALID_MESSAGE };
      }

      if (challenge.mobileNumber !== input.mobileNumber) {
        return { ok: false, error: OTP_INVALID_MESSAGE };
      }

      if (challenge.expiresAt.getTime() <= Date.now()) {
        await db.delete(otpChallenges).where(eq(otpChallenges.id, challenge.id));
        return { ok: false, error: OTP_INVALID_MESSAGE };
      }

      if (challenge.attempts >= challenge.maxAttempts) {
        return { ok: false, error: OTP_INVALID_MESSAGE };
      }

      if (!safeEqualHash(challenge.codeHash, input.code.trim())) {
        await db
          .update(otpChallenges)
          .set({ attempts: challenge.attempts + 1 })
          .where(eq(otpChallenges.id, challenge.id));
        return { ok: false, error: OTP_INVALID_MESSAGE };
      }

      await db.delete(otpChallenges).where(eq(otpChallenges.id, challenge.id));
      return { ok: true };
    },
  };
}
