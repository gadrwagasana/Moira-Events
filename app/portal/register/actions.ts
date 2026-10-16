"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/client-portal/password";
import { generateToken, hashToken } from "@/lib/client-portal/tokens";
import { sendEmail } from "@/lib/email/send";
import { verificationEmail } from "@/lib/email/templates";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { RegisterState } from "./types";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const schema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email address"),
    phone: z.preprocess(emptyToUndefined, z.string().optional()),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Always redirects to the same "check your email" interstitial regardless
// of which of the three cases below applied — never reveals whether the
// email already belongs to a client (§12). See plan §"Design: self-
// registration vs. an existing Client record" for why this is safe: email
// verification itself is the ownership proof, not the registration step.
export async function registerClient(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const ip = await getClientIp();
  if (!checkRateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const existing = await prisma.client.findUnique({
    where: { email: data.email },
    select: { id: true, passwordHash: true },
  });

  if (!existing) {
    const passwordHash = await hashPassword(data.password);
    const rawToken = generateToken();
    const client = await prisma.client.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash,
        passwordSetAt: new Date(),
        emailVerificationTokenHash: hashToken(rawToken),
        emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
      },
    });
    const email = verificationEmail(client.fullName, rawToken, client.email);
    await sendEmail({ to: client.email, ...email });
  } else if (!existing.passwordHash) {
    // Prospect created earlier via an enquiry/consultation — attach the
    // password to that SAME Client row (never a duplicate), gated behind
    // the same email-verification loop before it's usable.
    const passwordHash = await hashPassword(data.password);
    const rawToken = generateToken();
    const client = await prisma.client.update({
      where: { id: existing.id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        passwordHash,
        passwordSetAt: new Date(),
        emailVerificationTokenHash: hashToken(rawToken),
        emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
      },
    });
    const email = verificationEmail(client.fullName, rawToken, client.email);
    await sendEmail({ to: client.email, ...email });
  }
  // else: an account already exists and is active — do nothing, send
  // nothing. The redirect below is identical in every case.

  redirect(`/portal/verify-email?email=${encodeURIComponent(data.email)}`);
}
