"use server";

import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/admin/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { LoginState } from "./types";

// Timing-safe comparison for the single shared admin credential — same
// length-check-then-timingSafeEqual pattern already used for session-token
// signatures in lib/admin/session.ts, so a network attacker can't use
// response-time differences to narrow down the password character by
// character (Stage P audit finding).
function passwordMatches(input: string, expected: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const ip = await getClientIp();
  if (!checkRateLimit(`admin-login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 })) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const password = String(formData.get("password") ?? "");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !passwordMatches(password, adminPassword)) {
    return { status: "error", message: "Incorrect password." };
  }

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  redirect("/admin/enquiries");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
