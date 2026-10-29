"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/client-portal/tokens";
import { invitationEmail } from "@/lib/email/templates";
import { sendTrackedEmail } from "@/lib/email/outbox";
import { requireAdminRole } from "@/lib/admin/auth";

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — technical parameter, not business policy

// Admin-side only — requireAdminRole("ADMIN") below (CMS Phase 2) gates this
// directly, on top of proxy.ts's page-level check. The resulting link is
// ALSO shown to admin to copy/send manually — kept as a fallback in case
// email delivery fails, not replaced by it (Stage L2).
//
// The token is hashed at rest (Stage K.5 §8/§11) — the raw value only ever
// exists here, transiently, and is carried back to the booking page via a
// one-time redirect query param. It is never stored anywhere and can never
// be re-displayed after this request — regenerating is the only way to get
// a fresh link, which also doubles as the password-reset mechanism.
//
// Known limitation (Stage L2, not fixed this stage): this action is not
// itself idempotent — it rotates inviteTokenHash on every call, so a
// double-click mints two tokens and silently invalidates whichever one was
// just shown/emailed. sendTrackedEmail's idempotency layer only protects
// against the SAME email being sent twice for a single request; it cannot
// make an already-rotated token valid again. Fixing this properly means
// changing invite-generation semantics (e.g. not rotating an unexpired
// token), which is a K.5-era concern out of scope for an email stage.
export async function generateClientPortalInvite(clientId: string, bookingId: string) {
  await requireAdminRole("ADMIN");
  const rawToken = generateToken();
  const inviteTokenExpiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

  const client = await prisma.client.update({
    where: { id: clientId },
    data: { inviteTokenHash: hashToken(rawToken), inviteTokenExpiresAt },
  });

  // sendTrackedEmail never throws (see lib/email/outbox.ts) — email failure
  // must never cost admin the one-time fallback link below.
  await sendTrackedEmail({
    type: "CLIENT_INVITATION",
    recipientEmail: client.email,
    relatedRecordType: "Client",
    relatedRecordId: clientId,
    idempotencyKey: `client-invitation:${clientId}:${randomUUID()}`,
    buildMessage: async () => ({ to: client.email, ...invitationEmail(client.fullName, rawToken) }),
  });

  redirect(`/admin/bookings/${bookingId}?invite=${rawToken}#portal-access`);
}
