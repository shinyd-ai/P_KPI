export const SESSION_COOKIE_NAME = "p_kpi_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

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

async function createSessionToken() {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

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
    new TextEncoder().encode("p-kpi-session-v1"),
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionCookieValue() {
  return createSessionToken();
}

export async function verifySessionCookieValue(value?: string) {
  if (!value || !getSessionSecret()) {
    return false;
  }

  return value === (await createSessionToken());
}
