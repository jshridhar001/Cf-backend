import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type ConfirmationLot,
  cooldownRemainingSeconds,
  evaluateConfirmationEligibility,
} from "@/features/farmers/confirmation-eligibility.js";

function lot(
  dispatchStatus: ConfirmationLot["dispatchStatus"],
  lotStatus: ConfirmationLot["lotStatus"],
  receivedAt: string | null = null,
): ConfirmationLot {
  return {
    dispatchStatus,
    lotStatus,
    receivedAt: receivedAt ? new Date(receivedAt) : null,
  };
}

describe("evaluateConfirmationEligibility", () => {
  it("rejects a farmer with no received lots", () => {
    const result = evaluateConfirmationEligibility({ lots: [], verifiedAt: null });
    assert.equal(result.eligible, false);
    assert.equal(result.reason, "No received lots yet.");
  });

  it("ignores nullified dispatches", () => {
    const result = evaluateConfirmationEligibility({
      lots: [lot("NULL", "PENDING")],
      verifiedAt: null,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.pendingCount, 0);
    assert.equal(result.reason, "No received lots yet.");
  });

  it("reports how many lots are still pending", () => {
    const result = evaluateConfirmationEligibility({
      lots: [
        lot("DELIVERED", "RECEIVED", "2026-01-01T00:00:00.000Z"),
        lot("IN_TRANSIT", "PENDING"),
      ],
      verifiedAt: null,
    });
    assert.equal(result.eligible, false);
    assert.equal(result.pendingCount, 1);
    assert.equal(result.reason, "1 lot is still pending.");
  });

  it("allows confirmation when every active lot is received", () => {
    const result = evaluateConfirmationEligibility({
      lots: [
        lot("DELIVERED", "RECEIVED", "2026-01-01T00:00:00.000Z"),
        lot("IN_TRANSIT", "RECEIVED", "2026-01-02T00:00:00.000Z"),
        lot("NULL", "PENDING"),
      ],
      verifiedAt: null,
    });
    assert.equal(result.eligible, true);
    assert.equal(result.alreadyConfirmed, false);
    assert.equal(result.receivedCount, 2);
  });

  it("keeps a confirmation that already covers the received lots", () => {
    const result = evaluateConfirmationEligibility({
      lots: [lot("DELIVERED", "RECEIVED", "2026-01-01T00:00:00.000Z")],
      verifiedAt: new Date("2026-01-02T00:00:00.000Z"),
    });
    assert.equal(result.eligible, false);
    assert.equal(result.alreadyConfirmed, true);
  });

  it("asks for a new OTP when a lot is received after the last confirmation", () => {
    const result = evaluateConfirmationEligibility({
      lots: [
        lot("DELIVERED", "RECEIVED", "2026-01-01T00:00:00.000Z"),
        lot("DELIVERED", "RECEIVED", "2026-02-01T00:00:00.000Z"),
      ],
      verifiedAt: new Date("2026-01-15T00:00:00.000Z"),
    });
    assert.equal(result.eligible, true);
    assert.equal(result.alreadyConfirmed, false);
  });
});

describe("cooldownRemainingSeconds", () => {
  it("counts down from 60 seconds", () => {
    const sentAt = new Date("2026-01-01T00:00:00.000Z");
    const now = sentAt.getTime() + 15_000;
    assert.equal(cooldownRemainingSeconds(sentAt, now), 45);
    assert.equal(cooldownRemainingSeconds(sentAt, sentAt.getTime() + 60_000), 0);
    assert.equal(cooldownRemainingSeconds(null, now), 0);
  });
});
