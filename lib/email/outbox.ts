import { prisma } from "@/lib/db";
import { Prisma, EmailType } from "@/lib/generated/prisma/client";
import { sendEmail, type EmailMessage } from "./send";

export type { SendEmailFormState } from "./send-email-state";
export { initialSendEmailFormState } from "./send-email-state";

// This project's Prisma 7 + driver-adapter (@prisma/adapter-pg) setup does
// NOT report P2002's meta in the classic `{target: string[]}` shape other
// files in this codebase assume (createQuoteFromEnquiry etc.) — confirmed
// by direct testing: meta here is
// `{driverAdapterError: {cause: {constraint: {index: "Model_field_key"}}}}`.
// Checked defensively against both shapes so this keeps working regardless
// of which one a given Prisma/driver-adapter version actually produces.
function isUniqueConstraintError(err: unknown, field: string) {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return false;
  const meta = err.meta as
    | { target?: string[]; driverAdapterError?: { cause?: { constraint?: { index?: string } } } }
    | undefined;
  if (Array.isArray(meta?.target) && meta.target.includes(field)) return true;
  const indexName = meta?.driverAdapterError?.cause?.constraint?.index;
  return typeof indexName === "string" && indexName.includes(field);
}

// Truncate so a verbose provider/stack error can never balloon the column
// or (more importantly) carry anything resembling a token/secret that might
// have leaked into an error message — keep only the first line's gist.
function sanitizeError(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, 500);
}

export type SendTrackedEmailArgs = {
  type: EmailType;
  recipientEmail: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  relatedRecordVersion?: number;
  /** A fresh-per-render value (crypto.randomUUID()) supplied by the caller —
   * this, not a record-level "has this ever been sent" check, is the actual
   * duplicate-send guard. Resubmitting the same requestId (double-click,
   * network retry) hits the same idempotencyKey; a genuine new send after
   * the page re-renders gets a new one and is allowed through. */
  idempotencyKey: string;
  /** Deferred on purpose — PDF rendering (or any other message-building
   * work) runs inside this function's own try/catch, so a rendering bug
   * lands as a FAILED row with a sanitized error instead of an uncaught
   * exception that skips both the audit trail and the caller's UI message. */
  buildMessage: () => Promise<EmailMessage>;
};

export type SendTrackedEmailResult = {
  status: "sent" | "failed" | "duplicate";
  message?: string;
  deliveryId: string;
};

// The single call site every tracked email type routes through. Never
// throws — every failure mode (duplicate key, message-build failure,
// provider failure, even an unexpected error in this function's own
// bookkeeping) resolves to a result object instead of propagating, so a
// caller like generateClientPortalInvite can safely await this before its
// existing redirect() without risking that redirect on an email bug.
export async function sendTrackedEmail(args: SendTrackedEmailArgs): Promise<SendTrackedEmailResult> {
  let deliveryId: string;

  try {
    const created = await prisma.emailDelivery.create({
      data: {
        type: args.type,
        recipientEmail: args.recipientEmail,
        relatedRecordType: args.relatedRecordType,
        relatedRecordId: args.relatedRecordId,
        relatedRecordVersion: args.relatedRecordVersion,
        idempotencyKey: args.idempotencyKey,
        status: "PENDING",
      },
    });
    deliveryId = created.id;
  } catch (err) {
    if (isUniqueConstraintError(err, "idempotencyKey")) {
      // Same requestId as an earlier attempt — a double-click/retry, not a
      // new send. Return the earlier attempt's outcome instead of sending
      // again. The row is guaranteed to exist since the unique violation
      // means something is already there under this exact key.
      const existing = await prisma.emailDelivery.findUniqueOrThrow({ where: { idempotencyKey: args.idempotencyKey } });
      return {
        status: existing.status === "FAILED" ? "failed" : "duplicate",
        message: existing.status === "FAILED" ? (existing.lastError ?? "Previous attempt failed.") : "Already sent.",
        deliveryId: existing.id,
      };
    }
    // Could not even create the tracking row — fail closed without ever
    // attempting a send, and without a deliveryId to report against.
    console.error("[email:outbox] failed to create EmailDelivery row:", err instanceof Error ? err.message : err);
    return { status: "failed", message: "Could not start the send — please try again.", deliveryId: "" };
  }

  try {
    await prisma.emailDelivery.update({
      where: { id: deliveryId },
      data: { status: "SENDING", attemptCount: { increment: 1 } },
    });

    const message = await args.buildMessage();
    const result = await sendEmail(message);

    if (result.ok) {
      await prisma.emailDelivery.update({
        where: { id: deliveryId },
        data: { status: "SENT", providerMessageId: result.providerMessageId },
      });
      return { status: "sent", deliveryId };
    }

    const lastError = sanitizeError(result.error);
    await prisma.emailDelivery.update({ where: { id: deliveryId }, data: { status: "FAILED", lastError } });
    return { status: "failed", message: lastError, deliveryId };
  } catch (err) {
    // Covers a buildMessage() throw (e.g. a PDF-rendering bug) as well as
    // any unexpected error from the status-update writes themselves.
    const lastError = sanitizeError(err instanceof Error ? err.message : "Unknown error building or sending the email.");
    try {
      await prisma.emailDelivery.update({ where: { id: deliveryId }, data: { status: "FAILED", lastError } });
    } catch {
      // Even the failure write failed — nothing more we can safely do here
      // without risking throwing out of a function that must never throw.
    }
    return { status: "failed", message: lastError, deliveryId };
  }
}

// Used by the small "Last sent" status line next to each Send button/form —
// reads the most recent delivery attempt for a given business record.
export async function getLatestEmailDelivery(type: EmailType, relatedRecordId: string) {
  return prisma.emailDelivery.findFirst({
    where: { type, relatedRecordId },
    orderBy: { createdAt: "desc" },
  });
}
