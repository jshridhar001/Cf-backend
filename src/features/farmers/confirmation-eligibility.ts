export const CONFIRMATION_OTP_RESEND_COOLDOWN_SECONDS = 60;

export type ConfirmationLot = {
  dispatchStatus: "IN_TRANSIT" | "DELIVERED" | "NULL";
  lotStatus: "PENDING" | "RECEIVED";
  receivedAt: Date | null;
};

export type ConfirmationEligibility = {
  eligible: boolean;
  alreadyConfirmed: boolean;
  pendingCount: number;
  receivedCount: number;
  reason: string | null;
};

export function evaluateConfirmationEligibility(input: {
  lots: ConfirmationLot[];
  verifiedAt: Date | null;
}): ConfirmationEligibility {
  const activeLots = input.lots.filter((lot) => lot.dispatchStatus !== "NULL");
  const pendingCount = activeLots.filter((lot) => lot.lotStatus !== "RECEIVED").length;
  const receivedLots = activeLots.filter((lot) => lot.lotStatus === "RECEIVED");
  const receivedCount = receivedLots.length;

  let latestReceivedAt: Date | null = null;
  for (const lot of receivedLots) {
    if (!lot.receivedAt) continue;
    if (!latestReceivedAt || lot.receivedAt.getTime() > latestReceivedAt.getTime()) {
      latestReceivedAt = lot.receivedAt;
    }
  }

  const coversCurrentLots =
    input.verifiedAt != null &&
    pendingCount === 0 &&
    receivedCount > 0 &&
    (latestReceivedAt == null || latestReceivedAt.getTime() <= input.verifiedAt.getTime());

  if (pendingCount > 0) {
    return {
      eligible: false,
      alreadyConfirmed: false,
      pendingCount,
      receivedCount,
      reason:
        pendingCount === 1 ? "1 lot is still pending." : `${pendingCount} lots are still pending.`,
    };
  }

  if (receivedCount === 0) {
    return {
      eligible: false,
      alreadyConfirmed: false,
      pendingCount: 0,
      receivedCount: 0,
      reason: "No received lots yet.",
    };
  }

  if (coversCurrentLots) {
    return {
      eligible: false,
      alreadyConfirmed: true,
      pendingCount: 0,
      receivedCount,
      reason: null,
    };
  }

  return {
    eligible: true,
    alreadyConfirmed: false,
    pendingCount: 0,
    receivedCount,
    reason: null,
  };
}

export function cooldownRemainingSeconds(otpSentAt: Date | null, now = Date.now()) {
  if (!otpSentAt) return 0;
  const elapsedSeconds = Math.floor((now - otpSentAt.getTime()) / 1000);
  return Math.max(0, CONFIRMATION_OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
}
