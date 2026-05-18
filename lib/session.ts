import { createHmac, timingSafeEqual } from "node:crypto";

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

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createSessionCookieValue(username: string) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifySessionCookieValue(value?: string) {
  const secret = getSessionSecret();

  if (!secret || !value) {
    return false;
  }

  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = sign(encodedPayload, secret);

  if (!signaturesMatch(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;

    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
