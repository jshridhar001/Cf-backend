import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/index.js";
import { dispatches, dispatchRequisitions } from "@/db/schema/seed-dispatch.js";
import { creditFarmerStockFromLot } from "@/features/seed-dispatch/stock-balance.js";
import {
  getOtpProvider,
  LOT_RECEIPT_OTP_PURPOSE,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/shared/otp/index.js";

type LotReceiptErrorCode =
  | "not_found"
  | "already_received"
  | "not_in_transit"
  | "no_mobile"
  | "cooldown"
  | "invalid_otp";

class LotReceiptFlowError extends Error {
  constructor(
    readonly code: LotReceiptErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LotReceiptFlowError";
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

async function runLotFlow<T>(work: () => Promise<T>) {
  try {
    const data = await work();
    return { error: null, data } as const;
  } catch (error) {
    if (error instanceof LotReceiptFlowError) {
      return { error: error.code, message: error.message } as const;
    }
    throw error;
  }
}

export async function sendLotReceiptOtp(lotId: string) {
  return await runLotFlow(async () => {
    const lot = await loadLotContext(lotId);
    if (!lot) {
      throw new LotReceiptFlowError("not_found", "Lot not found");
    }
    if (lot.status !== "PENDING") {
      throw new LotReceiptFlowError("already_received", "This lot has already been received.");
    }
    if (lot.dispatch.status !== "IN_TRANSIT") {
      throw new LotReceiptFlowError(
        "not_in_transit",
        "OTP can only be sent while the dispatch is in transit.",
      );
    }

    const mobileNumber = lot.requisition.farmer.mobileNumber.trim();
    if (!mobileNumber) {
      throw new LotReceiptFlowError("no_mobile", "This farmer has no mobile number on file.");
    }

    const remaining = cooldownRemainingSeconds(lot.otpSentAt);
    if (remaining > 0) {
      throw new LotReceiptFlowError("cooldown", `Please wait ${remaining}s before resending OTP.`);
    }

    const provider = getOtpProvider();
    const sendResult = await provider.sendOtp({
      purpose: LOT_RECEIPT_OTP_PURPOSE,
      referenceId: lotId,
      mobileNumber,
    });

    await db
      .update(dispatchRequisitions)
      .set({ otpSentAt: new Date() })
      .where(eq(dispatchRequisitions.id, lotId));

    return {
      mobileNumber,
      maskedMobile: maskMobile(mobileNumber),
      ...(sendResult.devOtp ? { devOtp: sendResult.devOtp } : {}),
      cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    };
  });
}

export async function confirmLotReceipt(lotId: string, otp: string, userId: string) {
  return await runLotFlow(async () => {
    const lot = await loadLotContext(lotId);
    if (!lot) {
      throw new LotReceiptFlowError("not_found", "Lot not found");
    }

    if (lot.status === "RECEIVED") {
      return {
        alreadyReceived: true as const,
        farmerId: lot.requisition.farmerId,
      };
    }

    if (lot.dispatch.status !== "IN_TRANSIT") {
      throw new LotReceiptFlowError(
        "not_in_transit",
        "OTP can only be confirmed while the dispatch is in transit.",
      );
    }

    const mobileNumber = lot.requisition.farmer.mobileNumber.trim();
    if (!mobileNumber) {
      throw new LotReceiptFlowError("no_mobile", "This farmer has no mobile number on file.");
    }

    const provider = getOtpProvider();
    const verifyResult = await provider.verifyOtp({
      purpose: LOT_RECEIPT_OTP_PURPOSE,
      referenceId: lotId,
      mobileNumber,
      code: otp,
    });

    if (!verifyResult.ok) {
      throw new LotReceiptFlowError("invalid_otp", verifyResult.error);
    }

    await db.transaction(async (tx) => {
      const freshLot = await tx.query.dispatchRequisitions.findFirst({
        where: eq(dispatchRequisitions.id, lotId),
        with: { dispatch: true },
      });

      if (!freshLot) {
        throw new LotReceiptFlowError("not_found", "Lot not found");
      }
      if (freshLot.status === "RECEIVED") return;

      if (freshLot.dispatch.status !== "IN_TRANSIT") {
        throw new LotReceiptFlowError(
          "not_in_transit",
          "OTP can only be confirmed while the dispatch is in transit.",
        );
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

      await creditFarmerStockFromLot(tx, {
        dispatchRequisitionId: lotId,
        farmerId: lot.requisition.farmerId,
        varietyId: lot.requisition.varietyId,
      });

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

    return {
      farmerId: lot.requisition.farmerId,
    };
  });
}
