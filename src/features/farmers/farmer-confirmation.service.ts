import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { farmers } from "@/db/schema/farmer.js";
import { dispatches, dispatchRequisitions } from "@/db/schema/seed-dispatch.js";
import { seedRequisitions } from "@/db/schema/seed-requisition.js";
import {
  CONFIRMATION_OTP_RESEND_COOLDOWN_SECONDS,
  cooldownRemainingSeconds,
  evaluateConfirmationEligibility,
} from "@/features/farmers/confirmation-eligibility.js";
import {
  InvalidMobileError,
  isMsg91ProviderFailure,
  Msg91ApiError,
  Msg91ConfigError,
  maskMobile,
  normalizeMobileNumber,
  readMsg91Config,
  sendMsg91Otp,
  verifyMsg91Otp,
} from "@/shared/sms/msg91.js";

export type FarmerConfirmationErrorCode =
  | "not_found"
  | "ineligible"
  | "no_mobile"
  | "invalid_mobile"
  | "cooldown"
  | "invalid_otp"
  | "not_configured"
  | "provider_error";

class FarmerConfirmationFlowError extends Error {
  constructor(
    readonly code: FarmerConfirmationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "FarmerConfirmationFlowError";
  }
}

async function runConfirmationFlow<T>(work: () => Promise<T>) {
  try {
    const data = await work();
    return { error: null, data } as const;
  } catch (error) {
    if (error instanceof FarmerConfirmationFlowError) {
      return { error: error.code, message: error.message } as const;
    }
    throw error;
  }
}

async function loadFarmer(farmerId: string) {
  const [farmer] = await db
    .select({
      id: farmers.id,
      mobileNumber: farmers.mobileNumber,
      confirmationOtpSentAt: farmers.confirmationOtpSentAt,
      confirmationOtpVerifiedAt: farmers.confirmationOtpVerifiedAt,
    })
    .from(farmers)
    .where(eq(farmers.id, farmerId))
    .limit(1);

  return farmer ?? null;
}

async function loadLots(farmerId: string) {
  return db
    .select({
      dispatchStatus: dispatches.status,
      lotStatus: dispatchRequisitions.status,
      receivedAt: dispatchRequisitions.receivedAt,
    })
    .from(dispatchRequisitions)
    .innerJoin(seedRequisitions, eq(dispatchRequisitions.requisitionId, seedRequisitions.id))
    .innerJoin(dispatches, eq(dispatchRequisitions.dispatchId, dispatches.id))
    .where(eq(seedRequisitions.farmerId, farmerId));
}

function readConfigOrThrow() {
  try {
    return readMsg91Config();
  } catch (error) {
    if (error instanceof Msg91ConfigError) {
      throw new FarmerConfirmationFlowError("not_configured", error.message);
    }
    throw error;
  }
}

function normalizeOrThrow(mobileNumber: string, countryCode: string) {
  const mobile = mobileNumber.trim();
  if (!mobile) {
    throw new FarmerConfirmationFlowError("no_mobile", "This farmer has no mobile number on file.");
  }

  try {
    return normalizeMobileNumber(mobile, countryCode);
  } catch (error) {
    if (error instanceof InvalidMobileError) {
      throw new FarmerConfirmationFlowError("invalid_mobile", error.message);
    }
    throw error;
  }
}

function maskedMobile(mobileNumber: string, countryCode: string) {
  try {
    return maskMobile(normalizeMobileNumber(mobileNumber, countryCode));
  } catch {
    const digits = mobileNumber.replace(/\D/g, "");
    return digits ? maskMobile(digits) : null;
  }
}

async function requireEligibleFarmer(farmerId: string) {
  const farmer = await loadFarmer(farmerId);
  if (!farmer) {
    throw new FarmerConfirmationFlowError("not_found", "Farmer not found.");
  }

  const lots = await loadLots(farmerId);
  const eligibility = evaluateConfirmationEligibility({
    lots,
    verifiedAt: farmer.confirmationOtpVerifiedAt,
  });

  if (!eligibility.eligible) {
    throw new FarmerConfirmationFlowError(
      "ineligible",
      eligibility.reason ?? "This farmer cannot be confirmed yet.",
    );
  }

  return farmer;
}

export async function getFarmerConfirmation(farmerId: string) {
  return runConfirmationFlow(async () => {
    const farmer = await loadFarmer(farmerId);
    if (!farmer) {
      throw new FarmerConfirmationFlowError("not_found", "Farmer not found.");
    }

    const lots = await loadLots(farmerId);
    const eligibility = evaluateConfirmationEligibility({
      lots,
      verifiedAt: farmer.confirmationOtpVerifiedAt,
    });

    let configured = true;
    let configurationError: string | null = null;
    let otpLength = 6;
    let countryCode = "91";
    try {
      const config = readMsg91Config();
      otpLength = config.otpLength;
      countryCode = config.countryCode;
    } catch (error) {
      if (!(error instanceof Msg91ConfigError)) throw error;
      configured = false;
      configurationError = error.message;
    }

    return {
      ...eligibility,
      maskedMobile: maskedMobile(farmer.mobileNumber, countryCode),
      otpSentAt: farmer.confirmationOtpSentAt?.toISOString() ?? null,
      verifiedAt: farmer.confirmationOtpVerifiedAt?.toISOString() ?? null,
      cooldownSeconds: cooldownRemainingSeconds(farmer.confirmationOtpSentAt),
      otpLength,
      configured,
      configurationError,
    };
  });
}

export async function sendFarmerConfirmationOtp(farmerId: string) {
  return runConfirmationFlow(async () => {
    const farmer = await requireEligibleFarmer(farmerId);
    const config = readConfigOrThrow();
    const mobile = normalizeOrThrow(farmer.mobileNumber, config.countryCode);
    const remaining = cooldownRemainingSeconds(farmer.confirmationOtpSentAt);
    if (remaining > 0) {
      throw new FarmerConfirmationFlowError(
        "cooldown",
        `Please wait ${remaining}s before resending OTP.`,
      );
    }

    try {
      await sendMsg91Otp(mobile, { config });
    } catch (error) {
      if (error instanceof Msg91ApiError) {
        throw new FarmerConfirmationFlowError("provider_error", error.message);
      }
      throw error;
    }

    await db
      .update(farmers)
      .set({ confirmationOtpSentAt: new Date() })
      .where(eq(farmers.id, farmerId));

    return {
      maskedMobile: maskMobile(mobile),
      cooldownSeconds: CONFIRMATION_OTP_RESEND_COOLDOWN_SECONDS,
      otpLength: config.otpLength,
    };
  });
}

export async function verifyFarmerConfirmationOtp(farmerId: string, otp: string, userId: string) {
  return runConfirmationFlow(async () => {
    const farmer = await requireEligibleFarmer(farmerId);
    const config = readConfigOrThrow();
    const mobile = normalizeOrThrow(farmer.mobileNumber, config.countryCode);

    if (!farmer.confirmationOtpSentAt) {
      throw new FarmerConfirmationFlowError("invalid_otp", "Request an OTP before confirming.");
    }
    if (otp.length !== config.otpLength) {
      throw new FarmerConfirmationFlowError(
        "invalid_otp",
        `Enter the ${config.otpLength}-digit OTP.`,
      );
    }

    try {
      await verifyMsg91Otp(mobile, otp, { config });
    } catch (error) {
      if (error instanceof Msg91ApiError) {
        const code = isMsg91ProviderFailure(error.message) ? "provider_error" : "invalid_otp";
        throw new FarmerConfirmationFlowError(code, error.message);
      }
      throw error;
    }

    const verifiedAt = new Date();
    await db
      .update(farmers)
      .set({
        confirmationOtpVerifiedAt: verifiedAt,
        confirmationOtpVerifiedById: userId,
      })
      .where(eq(farmers.id, farmerId));

    return { verifiedAt: verifiedAt.toISOString() };
  });
}
