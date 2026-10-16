"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { hashPassword, verifyPassword } from "@/lib/client-portal/password";
import { generateToken, hashToken } from "@/lib/client-portal/tokens";
import { sendEmail } from "@/lib/email/send";
import { verificationEmail } from "@/lib/email/templates";

const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export type ProfileFormState = { status: "idle" | "error" | "success"; message?: string };
export const initialProfileFormState: ProfileFormState = { status: "idle" };

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

const profileSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  whatsapp: z.preprocess(emptyToUndefined, z.string().optional()),
  currentPassword: z.string().min(1, "Enter your current password to save changes"),
});

// clientId is always derived from the authenticated session, never from a
// hidden form field — a client can never change which Client row they edit
// (Stage: Client Portal §18/§21).
export async function updateClientProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const clientId = await requireAuthenticatedClientId();

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const ok = await verifyPassword(data.currentPassword, client.passwordHash);
  if (!ok) {
    return { status: "error", message: "Current password is incorrect." };
  }

  // Changing email never updates the login email directly (§19) — the new
  // address must be re-verified first, so a mistyped address can't lock the
  // client out of their own account. Everything else updates immediately.
  const emailChanged = data.email !== client.email;

  try {
    if (emailChanged) {
      const existingWithEmail = await prisma.client.findUnique({ where: { email: data.email } });
      if (existingWithEmail) {
        return { status: "error", message: "That email address is already in use." };
      }

      const rawToken = generateToken();
      await prisma.client.update({
        where: { id: clientId },
        data: {
          fullName: data.fullName,
          phone: data.phone,
          whatsapp: data.whatsapp,
          pendingEmail: data.email,
          emailVerificationTokenHash: hashToken(rawToken),
          emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
        },
      });
      const email = verificationEmail(data.fullName, rawToken, data.email);
      await sendEmail({ to: data.email, ...email });

      revalidatePath("/portal/profile");
      return {
        status: "success",
        message: `Profile updated. Check ${data.email} for a link to confirm your new email — your login email stays the same until you do.`,
      };
    }

    await prisma.client.update({
      where: { id: clientId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        whatsapp: data.whatsapp,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { status: "error", message: "That email address is already in use." };
    }
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  revalidatePath("/portal/profile");
  return { status: "success", message: "Profile updated." };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export async function changeClientPassword(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const clientId = await requireAuthenticatedClientId();

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const ok = await verifyPassword(data.currentPassword, client.passwordHash);
  if (!ok) {
    return { status: "error", message: "Current password is incorrect." };
  }

  const passwordHash = await hashPassword(data.newPassword);
  await prisma.client.update({ where: { id: clientId }, data: { passwordHash, passwordSetAt: new Date() } });

  revalidatePath("/portal/profile");
  return { status: "success", message: "Password updated." };
}
