import type { FastifyReply, FastifyRequest } from "fastify";
import {
  confirmLotReceiptSchema,
  lotIdParamSchema,
} from "@/features/seed-dispatch/lot-receipt.schema.js";
import {
  confirmLotReceiptForLot,
  LotReceiptError,
  sendLotReceiptOtpForLot,
} from "@/features/seed-dispatch/lot-receipt.service.js";

export const lotReceiptController = {
  async sendOtp(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { lotId } = lotIdParamSchema.parse(req.params);
      const result = await sendLotReceiptOtpForLot(lotId);
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof LotReceiptError) {
        return reply.code(400).send({ ok: false, error: error.message });
      }
      if (error && typeof error === "object" && "issues" in error) {
        return reply.code(400).send({ ok: false, error: "Invalid lot id" });
      }
      req.log.error(error);
      return reply.code(500).send({ ok: false, error: "Internal Server Error" });
    }
  },

  async confirmReceipt(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { lotId } = lotIdParamSchema.parse(req.params);
      const { otp } = confirmLotReceiptSchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) {
        return reply.code(401).send({ ok: false, error: "Unauthorized" });
      }

      const result = await confirmLotReceiptForLot(lotId, otp, userId);
      return reply.send(result);
    } catch (error: unknown) {
      if (error instanceof LotReceiptError) {
        return reply.code(400).send({ ok: false, error: error.message });
      }
      if (error && typeof error === "object" && "issues" in error) {
        return reply.code(400).send({ ok: false, error: "Enter the 6-digit OTP" });
      }
      req.log.error(error);
      return reply.code(500).send({ ok: false, error: "Internal Server Error" });
    }
  },
};
