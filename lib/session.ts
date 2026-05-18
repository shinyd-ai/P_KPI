export const SESSION_COOKIE_NAME = "p_kpi_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  username: string;
  exp: number;
};

export function getAppCredentials() {
  const username = process.env.APP_USERNAME ?? process.env.BASIC_AUTH_USERNAME;
  const password = process.env.APP_PASSWORD ?? process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

export function getSessionSecret() {
  return (
    process.env.SESSION_SECRET ??
    process.env.APP_PASSWORD ??
    process.env.BASIC_AUTH_PASSWORD ??
    null
  );
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function encodeJson(value: unknown) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeJson<T>(value: string) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))) as T;
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionCookieValue(username: string) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = encodeJson(payload);

  return `${encodedPayload}.${await sign(encodedPayload, secret)}`;
}

export async function verifySessionCookieValue(value?: string) {
  const secret = getSessionSecret();

  if (!secret || !value) {
    return false;
  }

  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await sign(encodedPayload, secret);

  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const payload = decodeJson<SessionPayload>(encodedPayload);

    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
