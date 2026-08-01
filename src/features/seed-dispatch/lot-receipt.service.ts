import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/index.js";
import { dispatches, dispatchRequisitions } from "@/db/schema/seed-dispatch.js";
import {
  getOtpProvider,
  LOT_RECEIPT_OTP_PURPOSE,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/shared/otp/index.js";

export class LotReceiptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LotReceiptError";
  }
}

function maskMobile(mobileNumber: string): string {
  if (mobileNumber.length <= 4) return mobileNumber;
  return `${"*".repeat(mobileNumber.length - 4)}${mobileNumber.slice(-4)}`;
}

function cooldownRemainingSeconds(otpSentAt: Date | null): number {
  if (!otpSentAt) return 0;
  const elapsedSeconds = Math.floor((Date.now() - otpSentAt.getTime()) / 1000);
  return Math.max(0, OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
}

async function loadLotContext(lotId: string) {
  return db.query.dispatchRequisitions.findFirst({
    where: eq(dispatchRequisitions.id, lotId),
    with: {
      dispatch: true,
      requisition: {
        with: {
          farmer: true,
        },
      },
      sizeLines: true,
    },
  });
}

export async function sendLotReceiptOtpForLot(lotId: string) {
  const lot = await loadLotContext(lotId);
  if (!lot) throw new LotReceiptError("Lot not found.");
  if (lot.status !== "PENDING") {
    throw new LotReceiptError("This lot has already been received.");
  }
  // This schema uses IN_TRANSIT for "on the road" (guide's DELIVERING).
  if (lot.dispatch.status !== "IN_TRANSIT") {
    throw new LotReceiptError("OTP can only be sent while the dispatch is delivering.");
  }

  const mobileNumber = lot.requisition.farmer.mobileNumber?.trim() ?? "";
  if (!mobileNumber) {
    throw new LotReceiptError("This farmer has no mobile number on file.");
  }

  const remaining = cooldownRemainingSeconds(lot.otpSentAt);
  if (remaining > 0) {
    throw new LotReceiptError(`Please wait ${remaining}s before resending OTP.`);
  }

  const provider = getOtpProvider();
  const sendResult = await provider.sendOtp({
    purpose: LOT_RECEIPT_OTP_PURPOSE,
    referenceId: lotId,
    mobileNumber,
  });

  const now = new Date();
  await db
    .update(dispatchRequisitions)
    .set({ otpSentAt: now })
    .where(eq(dispatchRequisitions.id, lotId));

  return {
    ok: true as const,
    mobileNumber,
    maskedMobile: maskMobile(mobileNumber),
    ...(sendResult.devOtp ? { devOtp: sendResult.devOtp } : {}),
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

export async function confirmLotReceiptForLot(lotId: string, otp: string, userId: string) {
  const lot = await loadLotContext(lotId);
  if (!lot) throw new LotReceiptError("Lot not found.");

  if (lot.status === "RECEIVED") {
    return { ok: true as const, alreadyReceived: true as const };
  }

  if (lot.dispatch.status !== "IN_TRANSIT") {
    throw new LotReceiptError("OTP can only be confirmed while the dispatch is delivering.");
  }

  const mobileNumber = lot.requisition.farmer.mobileNumber?.trim() ?? "";
  if (!mobileNumber) {
    throw new LotReceiptError("This farmer has no mobile number on file.");
  }

  const provider = getOtpProvider();
  const verifyResult = await provider.verifyOtp({
    purpose: LOT_RECEIPT_OTP_PURPOSE,
    referenceId: lotId,
    mobileNumber,
    code: otp,
  });

  if (!verifyResult.ok) {
    throw new LotReceiptError(verifyResult.error);
  }

  await db.transaction(async (tx) => {
    const freshLot = await tx.query.dispatchRequisitions.findFirst({
      where: eq(dispatchRequisitions.id, lotId),
      with: { dispatch: true },
    });

    if (!freshLot) throw new LotReceiptError("Lot not found.");
    if (freshLot.status === "RECEIVED") return;

    if (freshLot.dispatch.status !== "IN_TRANSIT") {
      throw new LotReceiptError("OTP can only be confirmed while the dispatch is delivering.");
    }

    const now = new Date();
    await tx
      .update(dispatchRequisitions)
      .set({
        status: "RECEIVED",
        receivedAt: now,
        receivedById: userId,
        otpVerifiedAt: now,
      })
      .where(eq(dispatchRequisitions.id, lotId));

    // TODO: creditFarmerStockFromLot(tx, { dispatchRequisitionId, farmerId, varietyId })
    // once farmer_stock_balance helpers exist.

    const pendingSibling = await tx.query.dispatchRequisitions.findFirst({
      where: and(
        eq(dispatchRequisitions.dispatchId, freshLot.dispatchId),
        ne(dispatchRequisitions.status, "RECEIVED"),
      ),
    });

    if (!pendingSibling) {
      await tx
        .update(dispatches)
        .set({ status: "DELIVERED", updatedAt: now })
        .where(eq(dispatches.id, freshLot.dispatchId));
    }
  });

  return { ok: true as const };
}
