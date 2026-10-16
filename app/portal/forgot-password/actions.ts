"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/client-portal/tokens";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ForgotPasswordState } from "./types";

const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const GENERIC_MESSAGE = "If that email has an account, we've sent password reset instructions.";

const schema = z.object({ email: z.string().email() });

// Never reveals whether the email exists or has an account (§16) —
// identical response on every path, rate-limited per §27.
export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const ip = await getClientIp();
  if (!checkRateLimit(`forgot-password:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "sent", message: GENERIC_MESSAGE };
  }

  const client = await prisma.client.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, fullName: true, email: true, passwordHash: true },
  });

  if (client && client.passwordHash) {
    const rawToken = generateToken();
    await prisma.client.update({
      where: { id: client.id },
      data: {
        passwordResetTokenHash: hashToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
      },
    });
    const email = passwordResetEmail(client.fullName, rawToken);
    await sendEmail({ to: client.email, ...email });
  }

  return { status: "sent", message: GENERIC_MESSAGE };
}
