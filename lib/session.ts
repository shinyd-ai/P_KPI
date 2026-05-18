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

export function createSessionCookieValue() {
  return "authenticated";
}

export function verifySessionCookieValue(value?: string) {
  return value === "authenticated";
}
