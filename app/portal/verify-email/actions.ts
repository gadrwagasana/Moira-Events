"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashToken, generateToken } from "@/lib/client-portal/tokens";
import {
  CLIENT_SESSION_COOKIE,
  CLIENT_SESSION_MAX_AGE_SECONDS,
  createClientSessionToken,
} from "@/lib/client-portal/session";
import { sendEmail } from "@/lib/email/send";
import { verificationEmail } from "@/lib/email/templates";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ResendState } from "./types";

const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function confirmEmailVerification(token: string) {
  const tokenHash = hashToken(token);
  const client = await prisma.client.findUnique({
    where: { emailVerificationTokenHash: tokenHash },
    select: { id: true, emailVerificationExpiresAt: true, pendingEmail: true },
  });

  if (!client || !client.emailVerificationExpiresAt || client.emailVerificationExpiresAt < new Date()) {
    redirect("/portal/verify-email?invalid=1");
  }

  // Handles both fresh-registration completion AND a profile email-change
  // confirmation (§19) with the same token mechanism — if pendingEmail is
  // set, this confirms the NEW address rather than the original one.
  await prisma.client.update({
    where: { id: client.id },
    data: {
      email: client.pendingEmail ?? undefined,
      pendingEmail: null,
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      lastLoginAt: new Date(),
    },
  });

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

const resendSchema = z.object({ email: z.string().email() });

// Always returns the same generic confirmation regardless of whether the
// email exists/is already verified (§9/§12) — rate-limited per §27.
export async function resendVerificationEmail(_prevState: ResendState, formData: FormData): Promise<ResendState> {
  const ip = await getClientIp();
  if (!checkRateLimit(`resend-verify:${ip}`, { limit: 3, windowMs: 15 * 60 * 1000 })) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = resendSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "sent", message: "If that email can be verified, we've sent a new link." };
  }

  const client = await prisma.client.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, fullName: true, email: true, passwordHash: true, emailVerifiedAt: true },
  });

  if (client && client.passwordHash && !client.emailVerifiedAt) {
    const rawToken = generateToken();
    await prisma.client.update({
      where: { id: client.id },
      data: {
        emailVerificationTokenHash: hashToken(rawToken),
        emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
      },
    });
    const email = verificationEmail(client.fullName, rawToken, client.email);
    await sendEmail({ to: client.email, ...email });
  }

  return { status: "sent", message: "If that email can be verified, we've sent a new link." };
}
