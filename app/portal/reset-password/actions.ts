"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/client-portal/password";
import { hashToken } from "@/lib/client-portal/tokens";
import type { ResetPasswordState } from "./types";

const INVALID_TOKEN_MESSAGE = "This password reset link is invalid or has expired. Please request a new one.";

const schema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Single-use: the token hash is cleared the moment it's consumed, so a
// compromised/leaked reset token cannot be replayed (§17).
export async function resetPassword(_prevState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const { token, password } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { passwordResetTokenHash: hashToken(token) },
    select: { id: true, passwordResetExpiresAt: true },
  });

  if (!client || !client.passwordResetExpiresAt || client.passwordResetExpiresAt < new Date()) {
    return { status: "error", message: INVALID_TOKEN_MESSAGE };
  }

  const passwordHash = await hashPassword(password);
  await prisma.client.update({
    where: { id: client.id },
    data: {
      passwordHash,
      passwordSetAt: new Date(),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  redirect("/portal/login?reset=1");
}
