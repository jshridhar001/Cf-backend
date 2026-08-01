import { createMockOtpProvider } from "@/shared/otp/mock-provider.js";
import type { OtpProvider } from "@/shared/otp/types.js";

export { hashOtp, safeEqualHash } from "@/shared/otp/hash.js";
export * from "@/shared/otp/types.js";

export function getOtpProvider(): OtpProvider {
  return createMockOtpProvider(); // swap when real SMS is wired
}
