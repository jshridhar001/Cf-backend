import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  InvalidMobileError,
  Msg91ApiError,
  Msg91ConfigError,
  normalizeMobileNumber,
  parseMsg91Response,
  readMsg91Config,
  sendMsg91Otp,
  verifyMsg91Otp,
} from "@/shared/sms/msg91.js";

const config = {
  authKey: "test-auth-key",
  templateId: "template-1",
  countryCode: "91",
  otpLength: 6,
  otpExpiryMinutes: 10,
  baseUrl: "https://control.msg91.com",
};

describe("normalizeMobileNumber", () => {
  it("prefixes a 10-digit number with the country code", () => {
    assert.equal(normalizeMobileNumber("98765 43210", "91"), "919876543210");
  });

  it("keeps a number that already includes the country code", () => {
    assert.equal(normalizeMobileNumber("+91-9876543210", "91"), "919876543210");
  });

  it("rejects a number that is not 10 digits", () => {
    assert.throws(() => normalizeMobileNumber("12345", "91"), InvalidMobileError);
  });
});

describe("readMsg91Config", () => {
  it("requires the auth key and template id", () => {
    assert.throws(
      () => readMsg91Config({ MSG91_AUTH_KEY: "", MSG91_OTP_TEMPLATE_ID: "template-1" }),
      Msg91ConfigError,
    );
  });

  it("uses the documented defaults", () => {
    const result = readMsg91Config({
      MSG91_AUTH_KEY: "key",
      MSG91_OTP_TEMPLATE_ID: "template-1",
    });
    assert.equal(result.countryCode, "91");
    assert.equal(result.otpLength, 6);
    assert.equal(result.otpExpiryMinutes, 10);
    assert.equal(result.baseUrl, "https://control.msg91.com");
  });
});

describe("parseMsg91Response", () => {
  it("accepts a success payload", () => {
    assert.deepEqual(parseMsg91Response(200, { type: "success", request_id: "req-1" }), {
      ok: true,
      requestId: "req-1",
    });
  });

  it("treats HTTP 200 with type error as a failure", () => {
    assert.deepEqual(parseMsg91Response(200, { type: "error", message: "Invalid authkey" }), {
      ok: false,
      message: "Invalid authkey",
    });
  });

  it("accepts the documented verify success message", () => {
    assert.deepEqual(parseMsg91Response(200, { message: "OTP verified success" }), {
      ok: true,
      requestId: null,
    });
  });
});

describe("MSG91 requests", () => {
  it("sends the OTP without putting the auth key in the URL", async () => {
    let capturedUrl = "";
    let capturedAuth = "";
    const fetchImpl: typeof fetch = async (input, init) => {
      capturedUrl = String(input);
      capturedAuth = new Headers(init?.headers).get("authkey") ?? "";
      return new Response(JSON.stringify({ type: "success", request_id: "req-1" }), {
        status: 200,
      });
    };

    const result = await sendMsg91Otp("919876543210", { config, fetchImpl });
    const url = new URL(capturedUrl);
    assert.equal(result.requestId, "req-1");
    assert.equal(url.pathname, "/api/v5/otp");
    assert.equal(url.searchParams.get("template_id"), "template-1");
    assert.equal(url.searchParams.get("mobile"), "919876543210");
    assert.equal(url.searchParams.get("otp_length"), "6");
    assert.equal(url.searchParams.get("realTimeResponse"), "1");
    assert.equal(url.searchParams.get("authkey"), null);
    assert.equal(capturedAuth, "test-auth-key");
  });

  it("rejects a send response whose type is error", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ type: "error", message: "Template ID missing" }), {
        status: 200,
      });

    await assert.rejects(
      () => sendMsg91Otp("919876543210", { config, fetchImpl }),
      (error: unknown) => error instanceof Msg91ApiError && error.message === "Template ID missing",
    );
  });

  it("verifies the code against the MSG91 verify endpoint", async () => {
    let capturedUrl = "";
    const fetchImpl: typeof fetch = async (input) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify({ type: "success", message: "OTP verified success" }), {
        status: 200,
      });
    };

    await verifyMsg91Otp("919876543210", "123456", { config, fetchImpl });
    const url = new URL(capturedUrl);
    assert.equal(url.pathname, "/api/v5/otp/verify");
    assert.equal(url.searchParams.get("otp"), "123456");
    assert.equal(url.searchParams.get("mobile"), "919876543210");
  });
});
