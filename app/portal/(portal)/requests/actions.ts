"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { TaskPriority } from "@/lib/generated/prisma/client";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getPrimaryBookingForClient } from "@/lib/client-portal/data";
import { recordAuditEvent } from "@/lib/audit/log";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);
const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);

const createSchema = z.object({
  subject: z.preprocess(trim, z.string().min(1, "Subject is required").max(200, "Subject is too long")),
  message: z.preprocess(trim, z.string().min(1, "Message is required").max(5000, "Message is too long")),
  priority: z.preprocess(emptyToUndefined, z.nativeEnum(TaskPriority).optional()).default("MEDIUM"),
});

export type RequestFormState = { status: "idle" | "error"; message?: string };
export const initialRequestFormState: RequestFormState = { status: "idle" };

// clientId and bookingId are both derived server-side — never trusted from
// the form (§6). A client's own authenticated session is the only source of
// truth for who they are and which booking the request attaches to.
export async function createPlanningRequest(
  _prevState: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const clientId = await requireAuthenticatedClientId();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const booking = await getPrimaryBookingForClient(clientId);
  if (!booking) {
    return { status: "error", message: "You don't have an event on file yet, so a request can't be attached to one." };
  }

  const request = await prisma.planningRequest.create({
    data: {
      bookingId: booking.id,
      clientId,
      subject: parsed.data.subject,
      message: parsed.data.message,
      priority: parsed.data.priority,
      createdBy: clientId,
    },
  });

  // Before the redirect below — anything placed after it would be dead
  // code, since redirect() throws to unwind this function. subject/message
  // deliberately omitted from the summary (the client's own free text).
  await recordAuditEvent({
    actorType: "CLIENT",
    actorId: clientId,
    action: "planning_request.created",
    entityType: "PlanningRequest",
    entityId: request.id,
    outcome: "SUCCESS",
    summary: "Client created a planning request",
  });

  revalidatePath("/portal/requests");
  redirect(`/portal/requests/${request.id}`);
}

const followUpSchema = z.object({
  message: z.preprocess(trim, z.string().min(1, "Message is required").max(5000, "Message is too long")),
});

export type FollowUpFormState = { status: "idle" | "error"; message?: string };
export const initialFollowUpFormState: FollowUpFormState = { status: "idle" };

export async function addClientFollowUpMessage(
  requestId: string,
  _prevState: FollowUpFormState,
  formData: FormData,
): Promise<FollowUpFormState> {
  const clientId = await requireAuthenticatedClientId();

  const parsed = followUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  // Ownership check before any write — a client can only ever message
  // their own request (§13/§20-21 IDOR requirement).
  const request = await prisma.planningRequest.findFirst({ where: { id: requestId, clientId } });
  if (!request) {
    return { status: "error", message: "Request not found." };
  }
  if (request.status === "RESOLVED" || request.status === "CANCELLED") {
    return { status: "error", message: "This request is closed and can no longer receive new messages." };
  }

  await prisma.planningRequestMessage.create({
    data: { planningRequestId: requestId, senderType: "CLIENT", message: parsed.data.message, createdBy: clientId },
  });

  await recordAuditEvent({
    actorType: "CLIENT",
    actorId: clientId,
    action: "planning_request.follow_up_added",
    entityType: "PlanningRequest",
    entityId: requestId,
    outcome: "SUCCESS",
    summary: "Client added a follow-up message",
  });

  revalidatePath(`/portal/requests/${requestId}`);
  return { status: "idle" };
}
