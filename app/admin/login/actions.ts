"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyAdminPassword, DECOY_PASSWORD_HASH } from "@/lib/admin/password";
import {
  ADMIN_IDENTITY_SESSION_COOKIE,
  ADMIN_IDENTITY_SESSION_MAX_AGE_SECONDS,
  createAdminIdentityToken,
} from "@/lib/admin/identity-session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordAuditEvent } from "@/lib/audit/log";
import type { LoginState } from "./types";

// CMS Phase 2 — replaces the old single-shared-ADMIN_PASSWORD login with
// individual email+password accounts against the Admin table, as one
// coherent change together with proxy.ts and app/admin/(dashboard)/layout.tsx
// (see SETUP.md "CMS Phase 2"). The old ADMIN_SESSION_COOKIE/ADMIN_PASSWORD
// path is no longer issued or checked anywhere — it is not kept as an
// alternate route into the dashboard. UNTESTED end-to-end: no migration has
// been applied, so the Admin table this reads does not exist in the real
// database yet; this code is complete and type-checks but a real login
// cannot be exercised until the migration + bootstrap steps in SETUP.md are
// approved and run.
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const ip = await getClientIp();
  if (!checkRateLimit(`admin-login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 })) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Incorrect email or password." };
  }
  const { email, password } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { email } });

  // Always runs verifyAdminPassword with a real Argon2id comparison — using
  // the admin's actual stored hash if the email exists (even if the account
  // is disabled), or DECOY_PASSWORD_HASH if it doesn't — so a non-existent
  // email, a disabled account, and a wrong password all take the same
  // amount of time and get the same generic message. Never reveals which
  // condition actually failed.
  const passwordOk = await verifyAdminPassword(password, admin?.passwordHash ?? DECOY_PASSWORD_HASH);

  if (!admin || !admin.isActive || !passwordOk) {
    // Never throws (lib/audit/log.ts) — an audit-write failure must not
    // turn a failed login into a successful one.
    await recordAuditEvent({
      actorType: "ADMIN",
      actorId: admin?.id ?? "unknown",
      action: "admin.login_failed",
      entityType: "Admin",
      entityId: admin?.id ?? email.slice(0, 200),
      outcome: "FAILURE",
      summary: `Failed admin login attempt for ${email}`,
    });
    return { status: "error", message: "Incorrect email or password." };
  }

  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: admin.id,
    action: "admin.login_succeeded",
    entityType: "Admin",
    entityId: admin.id,
    outcome: "SUCCESS",
    summary: `Admin ${admin.email} signed in`,
  });

  const store = await cookies();
  store.set(ADMIN_IDENTITY_SESSION_COOKIE, createAdminIdentityToken(admin.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_IDENTITY_SESSION_MAX_AGE_SECONDS,
  });

  redirect("/admin/enquiries");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_IDENTITY_SESSION_COOKIE);
  redirect("/admin/login");
}
