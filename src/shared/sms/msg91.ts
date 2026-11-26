export class Msg91ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Msg91ConfigError";
  }
}

export class Msg91ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Msg91ApiError";
  }
}

export class InvalidMobileError extends Error {
  constructor(message = "Enter a 10-digit mobile number.") {
    super(message);
    this.name = "InvalidMobileError";
  }
}

export type Msg91Config = {
  authKey: string;
  templateId: string;
  countryCode: string;
  otpLength: number;
  otpExpiryMinutes: number;
  baseUrl: string;
};

const DEFAULT_BASE_URL = "https://control.msg91.com";
const DEFAULT_COUNTRY_CODE = "91";
const DEFAULT_OTP_LENGTH = 6;
const DEFAULT_OTP_EXPIRY_MINUTES = 10;

function readBoundedInt(
  raw: string | undefined,
  fallback: number,
  name: string,
  min: number,
  max: number,
) {
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Msg91ConfigError(`${name} must be an integer from ${min} to ${max}.`);
  }
  return value;
}

export function readMsg91Config(env: NodeJS.ProcessEnv = process.env): Msg91Config {
  const authKey = env.MSG91_AUTH_KEY?.trim() ?? "";
  const templateId = env.MSG91_OTP_TEMPLATE_ID?.trim() ?? "";
  if (!authKey || !templateId) {
    throw new Msg91ConfigError(
      "MSG91 is not configured. Set MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID.",
    );
  }

  const countryCode = (env.MSG91_COUNTRY_CODE?.trim() || DEFAULT_COUNTRY_CODE).replace(/\D/g, "");
  if (!countryCode) {
    throw new Msg91ConfigError("MSG91_COUNTRY_CODE must contain digits.");
  }

  return {
    authKey,
    templateId,
    countryCode,
    otpLength: readBoundedInt(env.MSG91_OTP_LENGTH, DEFAULT_OTP_LENGTH, "MSG91_OTP_LENGTH", 4, 9),
    otpExpiryMinutes: readBoundedInt(
      env.MSG91_OTP_EXPIRY_MINUTES,
      DEFAULT_OTP_EXPIRY_MINUTES,
      "MSG91_OTP_EXPIRY_MINUTES",
      1,
      10080,
    ),
    baseUrl: DEFAULT_BASE_URL,
  };
}

export function normalizeMobileNumber(mobileNumber: string, countryCode: string) {
  const digits = mobileNumber.replace(/\D/g, "");
  const code = countryCode.replace(/\D/g, "");
  if (!code) {
    throw new InvalidMobileError("Country code is not configured.");
  }
  if (digits.length === 10) return `${code}${digits}`;
  if (digits.length === code.length + 10 && digits.startsWith(code)) return digits;
  throw new InvalidMobileError("Enter a 10-digit mobile number.");
}

export function maskMobile(mobileNumber: string) {
  const digits = mobileNumber.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

type Msg91Body = {
  type?: unknown;
  message?: unknown;
  request_id?: unknown;
};

export function parseMsg91Response(
  status: number,
  body: unknown,
): { ok: true; requestId: string | null } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      message:
        status >= 400 ? "MSG91 rejected the request." : "MSG91 returned an unexpected response.",
    };
  }

  const record = body as Msg91Body;
  const message = typeof record.message === "string" ? record.message.trim() : "";
  const verified = record.type === "success" || message.toLowerCase() === "otp verified success";

  if (verified) {
    return {
      ok: true,
      requestId: typeof record.request_id === "string" ? record.request_id : null,
    };
  }

  if (record.type === "error" || status >= 400) {
    return { ok: false, message: message || "MSG91 rejected the request." };
  }

  return { ok: false, message: message || "MSG91 returned an unexpected response." };
}

type Msg91CallOptions = {
  config?: Msg91Config;
  fetchImpl?: typeof fetch;
};

async function readJsonBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function msg91Headers(authKey: string) {
  return {
    authkey: authKey,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export async function sendMsg91Otp(mobile: string, options: Msg91CallOptions = {}) {
  const config = options.config ?? readMsg91Config();
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = new URL("/api/v5/otp", config.baseUrl);
  url.searchParams.set("template_id", config.templateId);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("otp_length", String(config.otpLength));
  url.searchParams.set("otp_expiry", String(config.otpExpiryMinutes));
  url.searchParams.set("realTimeResponse", "1");

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: msg91Headers(config.authKey),
      body: "{}",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Msg91ApiError("Could not reach MSG91.");
  }

  const parsed = parseMsg91Response(response.status, await readJsonBody(response));
  if (!parsed.ok) throw new Msg91ApiError(parsed.message);
  return { requestId: parsed.requestId };
}

export async function verifyMsg91Otp(mobile: string, otp: string, options: Msg91CallOptions = {}) {
  const config = options.config ?? readMsg91Config();
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = new URL("/api/v5/otp/verify", config.baseUrl);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("otp", otp);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: msg91Headers(config.authKey),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Msg91ApiError("Could not reach MSG91.");
  }

  const parsed = parseMsg91Response(response.status, await readJsonBody(response));
  if (!parsed.ok) throw new Msg91ApiError(parsed.message);
  return { requestId: parsed.requestId };
}

export function isMsg91ProviderFailure(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("authkey") ||
    lower.includes("auth key") ||
    lower.includes("template") ||
    lower.includes("could not reach") ||
    lower.includes("balance") ||
    lower.includes("unexpected")
  );
}
