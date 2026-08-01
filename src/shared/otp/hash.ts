import { createHash, timingSafeEqual } from "node:crypto";

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function safeEqualHash(expectedHash: string, candidateCode: string): boolean {
  const candidateHash = hashOtp(candidateCode);
  const expected = Buffer.from(expectedHash, "utf8");
  const candidate = Buffer.from(candidateHash, "utf8");
  if (expected.length !== candidate.length) return false;
  return timingSafeEqual(expected, candidate);
}
