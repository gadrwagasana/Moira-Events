"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { PlanningRequestStatus, TaskPriority } from "@/lib/generated/prisma/client";
import { isValidTransition } from "@/lib/planning-requests/transitions";
import { planningResponseEmail, appUrl } from "@/lib/email/templates";
import { sendTrackedEmail } from "@/lib/email/outbox";
import { auditEventQuery, recordAuditEvent } from "@/lib/audit/log";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

const respondSchema = z.object({
  message: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, "Message is required")),
});

// Notifies the client whenever staff posts a reply — this is the only
// client-facing event on this model (every PlanningRequestMessage row is
// already client-visible by schema design, no internal-note concept
// exists here to accidentally leak). Keyed by the new message's own id, so
// it's naturally idempotent without needing a per-render requestId trick:
// a genuine new reply only ever creates one new row.
export async function respondToPlanningRequest(requestId: string, formData: FormData) {
  const parsed = respondSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const request = await prisma.planningRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { client: true },
  });

  const newMessage = await prisma.planningRequestMessage.create({
    data: {
      planningRequestId: requestId,
      senderType: "STAFF",
      message: parsed.data.message,
      createdBy: "admin",
    },
  });

  const result = await sendTrackedEmail({
    type: "PLANNING_RESPONSE",
    recipientEmail: request.client.email,
    relatedRecordType: "PlanningRequestMessage",
    relatedRecordId: newMessage.id,
    idempotencyKey: `planning-response:${newMessage.id}`,
    buildMessage: async () => ({
      to: request.client.email,
      ...planningResponseEmail(request.client.fullName, request.subject, appUrl(`/portal/requests/${requestId}`)),
    }),
  });

  // summary deliberately omits request.subject (client-typed free text) —
  // identified by id/reference only, consistent with "hand-composed, never
  // a raw pass-through of a form field."
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: "admin",
    action: "planning_request.responded",
    entityType: "PlanningRequest",
    entityId: requestId,
    outcome: "SUCCESS",
    summary: `Staff responded to planning request`,
  });
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: "admin",
    action: "planning_request.notification_sent",
    entityType: "PlanningRequest",
    entityId: requestId,
    outcome: result.status === "failed" ? "FAILURE" : "SUCCESS",
    correlationId: result.deliveryId,
    summary: `Planning request response notification ${result.status === "failed" ? `failed: ${result.message ?? "unknown error"}` : "sent"}`,
  });

  revalidatePath(`/admin/planning-requests/${requestId}`);
  revalidatePath("/admin/planning-requests");
  revalidatePath(`/admin/bookings/${request.bookingId}`);
}

const statusSchema = z.object({ status: z.nativeEnum(PlanningRequestStatus) });

export async function updatePlanningRequestStatus(requestId: string, formData: FormData) {
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const request = await prisma.planningRequest.findUniqueOrThrow({ where: { id: requestId } });
  if (!isValidTransition(request.status, parsed.data.status)) return;

  await prisma.$transaction([
    prisma.planningRequest.update({
      where: { id: requestId },
      data: { status: parsed.data.status, updatedBy: "admin" },
    }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: "admin",
      action: "planning_request.status_changed",
      entityType: "PlanningRequest",
      entityId: requestId,
      outcome: "SUCCESS",
      beforeValue: request.status,
      afterValue: parsed.data.status,
      summary: `Planning request status changed from ${request.status} to ${parsed.data.status}`,
    }),
  ]);

  revalidatePath(`/admin/planning-requests/${requestId}`);
  revalidatePath("/admin/planning-requests");
  revalidatePath(`/admin/bookings/${request.bookingId}`);
}

const prioritySchema = z.object({
  priority: z.preprocess(emptyToUndefined, z.nativeEnum(TaskPriority)),
});

export async function updatePlanningRequestPriority(requestId: string, formData: FormData) {
  const parsed = prioritySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const existing = await prisma.planningRequest.findUniqueOrThrow({ where: { id: requestId } });

  await prisma.$transaction([
    prisma.planningRequest.update({
      where: { id: requestId },
      data: { priority: parsed.data.priority, updatedBy: "admin" },
    }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: "admin",
      action: "planning_request.priority_changed",
      entityType: "PlanningRequest",
      entityId: requestId,
      outcome: "SUCCESS",
      beforeValue: existing.priority,
      afterValue: parsed.data.priority,
      summary: `Planning request priority changed from ${existing.priority} to ${parsed.data.priority}`,
    }),
  ]);

  revalidatePath(`/admin/planning-requests/${requestId}`);
  revalidatePath("/admin/planning-requests");
}
