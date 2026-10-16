"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/client-portal/password";
import { hashToken } from "@/lib/client-portal/tokens";
import {
  CLIENT_SESSION_COOKIE,
  CLIENT_SESSION_MAX_AGE_SECONDS,
  createClientSessionToken,
} from "@/lib/client-portal/session";
import type { ActivateState } from "./types";

const INVALID_TOKEN_MESSAGE = "This invitation link is invalid or has expired. Please contact Moira Events for a new link.";

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

export async function activateClientAccount(_prevState: ActivateState, formData: FormData): Promise<ActivateState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const { token, password } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { inviteTokenHash: hashToken(token) },
    select: { id: true, inviteTokenExpiresAt: true },
  });

  if (!client || !client.inviteTokenExpiresAt || client.inviteTokenExpiresAt < new Date()) {
    return { status: "error", message: INVALID_TOKEN_MESSAGE };
  }

  const passwordHash = await hashPassword(password);

  await prisma.client.update({
    where: { id: client.id },
    data: {
      passwordHash,
      passwordSetAt: new Date(),
      lastLoginAt: new Date(),
      // An admin-sent invite to a known address is itself sufficient proof
      // of email ownership — no separate verification step needed here.
      emailVerifiedAt: new Date(),
      inviteTokenHash: null,
      inviteTokenExpiresAt: null,
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
