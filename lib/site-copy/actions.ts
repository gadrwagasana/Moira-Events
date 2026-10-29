"use server";

// Mutation-side Server Action for SiteCopy. Follows the same convention as
// lib/site-images/actions.ts: Zod validation, revalidatePath, and
// auditEventQuery in the same $transaction as the write.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/auth";
import { auditEventQuery } from "@/lib/audit/log";
import { SITE_COPY_SLOTS, SITE_COPY_KEYS, type SiteCopyKey } from "./keys";

export async function upsertSiteCopy(key: string, formData: FormData) {
  const admin = await requireAdminRole("EDITOR");

  // The key never comes from arbitrary client input in practice (the admin
  // form hardcodes it per field), but it still arrives as an untyped
  // string argument on this exported action, so it's re-checked against
  // the explicit allowlist here regardless of what called it.
  if (!SITE_COPY_KEYS.includes(key as SiteCopyKey)) {
    return { status: "error" as const, message: "Unknown copy key." };
  }
  const slot = SITE_COPY_SLOTS.find((s) => s.key === key)!;

  const valueSchema = z.string().trim().max(slot.maxLength, `Must be ${slot.maxLength} characters or fewer.`);
  const parsed = valueSchema.safeParse(formData.get("value") ?? "");
  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Empty-after-trim clears the override (stored as null) rather than
  // saving a blank string — the page's `?? default` fallback then applies,
  // so an accidentally-submitted-empty field can never blank out required
  // hero text on the public site.
  const value = parsed.data.length > 0 ? parsed.data : null;

  await prisma.$transaction([
    prisma.siteCopy.upsert({
      where: { key },
      create: { key, value, updatedById: admin.id },
      update: { value, updatedById: admin.id },
    }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: admin.id,
      action: "site_copy.updated",
      entityType: "SiteCopy",
      entityId: key,
      outcome: "SUCCESS",
      summary: `Site copy "${key}" updated by ${admin.email}`,
    }),
  ]);

  revalidatePath("/");
  return { status: "success" as const };
}
