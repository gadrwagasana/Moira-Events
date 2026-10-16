"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/client-portal/password";
import {
  CLIENT_SESSION_COOKIE,
  CLIENT_SESSION_MAX_AGE_SECONDS,
  createClientSessionToken,
} from "@/lib/client-portal/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ClientLoginState } from "./types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Deliberately generic on every failure path (no account, no password set
// yet, wrong password) so the login form never reveals whether an email
// belongs to a client (Stage: Client Portal §20/§31).
const GENERIC_ERROR = "Incorrect email or password.";

export async function loginClient(_prevState: ClientLoginState, formData: FormData): Promise<ClientLoginState> {
  const ip = await getClientIp();
  if (!checkRateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 })) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: GENERIC_ERROR };
  }
  const { email, password } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, emailVerifiedAt: true },
  });

  const ok = await verifyPassword(password, client?.passwordHash);
  if (!client || !ok) {
    return { status: "error", message: GENERIC_ERROR };
  }

  // Only shown once the password has already matched — not an enumeration
  // risk at this point, and the client needs this specific message to know
  // what to do next (§13/§26).
  if (!client.emailVerifiedAt) {
    return {
      status: "error",
      message: "Please verify your email before signing in.",
      unverifiedEmail: email,
    };
  }

  await prisma.client.update({ where: { id: client.id }, data: { lastLoginAt: new Date() } });

  const store = await cookies();
  store.set(CLIENT_SESSION_COOKIE, createClientSessionToken(client.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CLIENT_SESSION_MAX_AGE_SECONDS,
  });

  redirect("/portal/dashboard");
}

export async function logoutClient() {
  const store = await cookies();
  store.delete(CLIENT_SESSION_COOKIE);
  redirect("/portal/login");
}
