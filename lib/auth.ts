export const AUTH_COOKIE_NAME = "stride_session";
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

function base64UrlEncode(input: ArrayBuffer | Uint8Array | string) {
  const bytes =
    typeof input === "string"
      ? encoder.encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return atob(padded);
}

function getSecret() {
  return process.env.AUTH_SECRET ?? process.env.BASIC_AUTH_PASSWORD ?? "";
}

export function isAuthConfigured() {
  return Boolean(getAuthUsername() && getAuthPassword() && getSecret());
}

export function getAuthUsername() {
  return process.env.APP_AUTH_USERNAME ?? process.env.BASIC_AUTH_USERNAME ?? "";
}

function getAuthPassword() {
  return process.env.APP_AUTH_PASSWORD ?? process.env.BASIC_AUTH_PASSWORD ?? "";
}

function timingSafeEqualString(a: string, b: string) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let i = 0; i < length; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }

  return diff === 0;
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64UrlEncode(signature);
}

export async function verifyLogin(username: string, password: string) {
  if (!isAuthConfigured()) {
    return process.env.NODE_ENV !== "production";
  }

  return (
    timingSafeEqualString(username, getAuthUsername()) &&
    timingSafeEqualString(password, getAuthPassword())
  );
}

export async function createAuthToken() {
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: getAuthUsername() || "local",
      exp: Math.floor(Date.now() / 1000) + AUTH_MAX_AGE_SECONDS,
    })
  );
  const signature = await sign(payload);

  return `${payload}.${signature}`;
}

export async function verifyAuthToken(token: string | undefined) {
  if (!token || !isAuthConfigured()) {
    return process.env.NODE_ENV !== "production";
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = await sign(payload);
  if (!timingSafeEqualString(signature, expectedSignature)) {
    return false;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
