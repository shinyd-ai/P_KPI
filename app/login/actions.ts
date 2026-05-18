"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionCookieValue,
  getAppCredentials,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

export async function login(formData: FormData) {
  const credentials = getAppCredentials();

  if (!credentials) {
    redirect("/login?error=config");
  }

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (username !== credentials.username || password !== credentials.password) {
    redirect("/login?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: createSessionCookieValue(username),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/");
}
