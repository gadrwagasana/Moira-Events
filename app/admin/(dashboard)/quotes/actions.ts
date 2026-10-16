"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma, QuoteStatus, EnquiryStatus } from "@/lib/generated/prisma/client";
import { generateReferenceNumber } from "@/lib/enquiries/reference";
import { computeQuoteTotals } from "@/lib/quotes/totals";
import { getQuoteDetail } from "@/lib/quotes/data";
import { getQuoteDocumentForAdmin } from "@/lib/documents/quote";
import { QuotePdf } from "@/lib/documents/quote-pdf";
import { renderPdfBuffer } from "@/lib/documents/render";
import { quoteIssuedEmail, appUrl } from "@/lib/email/templates";
import { sendTrackedEmail, type SendEmailFormState } from "@/lib/email/outbox";
import { isQuoteSendable } from "@/lib/quotes/send-guard";
import { auditEventQuery, recordAuditEvent } from "@/lib/audit/log";
import { isUniqueConstraintError } from "@/lib/prisma-errors";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

// Enquiry stays "what the client requested"; the Quote is a separate record
// ("what Moira Events proposes") that inherits from it once, then lives
// independently — editing the quote never touches the original enquiry.
export async function createQuoteFromEnquiry(enquiryId: string) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    include: { services: { include: { service: true } } },
  });
  if (!enquiry) throw new Error("Enquiry not found");

  let quoteId: string | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    const quoteNumber = generateReferenceNumber("MQ");
    try {
      const quote = await prisma.quote.create({
        data: {
          quoteNumber,
          enquiryId: enquiry.id,
          items: {
            create: enquiry.services.map((es, i) => ({
              serviceId: es.serviceId,
              description: es.service.name,
              quantity: 1,
              sortOrder: i,
            })),
          },
        },
      });
      quoteId = quote.id;
      break;
    } catch (err) {
      if (!isUniqueConstraintError(err, "quoteNumber")) throw err;
      // else loop and retry with a freshly generated quote number
    }
  }

  if (!quoteId) throw new Error("Could not generate a unique quote number");

  if (enquiry.status === "NEW" || enquiry.status === "UNDER_REVIEW") {
    await prisma.enquiry.update({ where: { id: enquiry.id }, data: { status: "QUOTE_PREPARATION" } });
  }

  // Before the redirect below — anything placed after it would be dead
  // code, since redirect() throws to unwind this function.
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: "admin",
    action: "quote.created",
    entityType: "Quote",
    entityId: quoteId,
    outcome: "SUCCESS",
    summary: `Quote created from enquiry ${enquiry.referenceNumber}`,
  });

  revalidatePath(`/admin/enquiries/${enquiryId}`);
  redirect(`/admin/quotes/${quoteId}`);
}

const detailsSchema = z.object({
  currency: z.preprocess(emptyToUndefined, z.string().optional()),
  issueDate: z.preprocess(emptyToUndefined, z.string().optional()),
  expiresAt: z.preprocess(emptyToUndefined, z.string().optional()),
  discountAmount: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  discountNote: z.preprocess(emptyToUndefined, z.string().optional()),
  taxAmount: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  taxNote: z.preprocess(emptyToUndefined, z.string().optional()),
  clientNotes: z.preprocess(emptyToUndefined, z.string().optional()),
  internalNotes: z.preprocess(emptyToUndefined, z.string().optional()),
  terms: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function updateQuoteDetails(quoteId: string, formData: FormData) {
  const parsed = detailsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  const items = await prisma.quoteItem.findMany({ where: { quoteId } });
  const { subtotal, totalAmount } = computeQuoteTotals(items, data.discountAmount, data.taxAmount);

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      currency: data.currency,
      issueDate: data.issueDate ? new Date(data.issueDate) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      discountAmount: data.discountAmount,
      discountNote: data.discountNote,
      taxAmount: data.taxAmount,
      taxNote: data.taxNote,
      clientNotes: data.clientNotes,
      internalNotes: data.internalNotes,
      terms: data.terms,
      subtotal,
      totalAmount,
    },
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
}

const addItemSchema = z
  .object({
    serviceId: z.preprocess(emptyToUndefined, z.string().optional()),
    // Required for custom items; auto-filled from the service name below
    // when a catalogue service is selected instead (the "Add Service" form
    // doesn't ask the admin to retype the service's own name).
    description: z.preprocess(emptyToUndefined, z.string().optional()),
    quantity: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()).default(1),
    unit: z.preprocess(emptyToUndefined, z.string().optional()),
    unitPrice: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    notes: z.preprocess(emptyToUndefined, z.string().optional()),
  })
  .refine((data) => data.serviceId || data.description, {
    message: "Select a service or enter a description",
    path: ["description"],
  });

export async function addQuoteItem(quoteId: string, formData: FormData) {
  const parsed = addItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  let description = data.description;
  if (!description && data.serviceId) {
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    description = service?.name;
  }
  if (!description) return;

  const total = data.unitPrice != null ? data.quantity * data.unitPrice : null;

  // Item write + totals recalculation in one transaction (Stage P audit
  // finding): these were previously two separate sequential awaits, so a
  // crash between them could leave Quote.subtotal/totalAmount stale relative
  // to the actual line items — a real integrity risk for a financial
  // document, even though self-healing on the next edit.
  await prisma.$transaction(async (tx) => {
    const existing = await tx.quoteItem.findMany({ where: { quoteId } });
    await tx.quoteItem.create({
      data: {
        quoteId,
        serviceId: data.serviceId,
        description,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        total,
        notes: data.notes,
        sortOrder: existing.length,
      },
    });
    await recalculateQuoteTotals(quoteId, tx);
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
}

const updateItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()).default(1),
  unit: z.preprocess(emptyToUndefined, z.string().optional()),
  unitPrice: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function updateQuoteItem(itemId: string, quoteId: string, formData: FormData) {
  const parsed = updateItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;
  const total = data.unitPrice != null ? data.quantity * data.unitPrice : null;

  await prisma.$transaction(async (tx) => {
    await tx.quoteItem.update({
      where: { id: itemId },
      data: {
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        total,
        notes: data.notes,
      },
    });
    await recalculateQuoteTotals(quoteId, tx);
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
}

export async function deleteQuoteItem(itemId: string, quoteId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.quoteItem.delete({ where: { id: itemId } });
    await recalculateQuoteTotals(quoteId, tx);
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
}

// Accepts a transaction client so every caller above can compose this with
// its own item write inside one atomic unit (Stage P) — never called with
// the bare `prisma` client, so totals are never persisted out of sync with
// the item list that produced them.
async function recalculateQuoteTotals(quoteId: string, tx: Prisma.TransactionClient) {
  const [items, quote] = await Promise.all([
    tx.quoteItem.findMany({ where: { quoteId } }),
    tx.quote.findUniqueOrThrow({ where: { id: quoteId } }),
  ]);
  const { subtotal, totalAmount } = computeQuoteTotals(items, quote.discountAmount, quote.taxAmount);
  await tx.quote.update({ where: { id: quoteId }, data: { subtotal, totalAmount } });
}

const statusSchema = z.object({
  status: z.nativeEnum(QuoteStatus),
  // Who the status change is attributed to — "who accepted" or "who
  // declined", depending on the chosen status. One field, since only one of
  // these ever applies per submission.
  actedBy: z.preprocess(emptyToUndefined, z.string().optional()),
  declineReason: z.preprocess(emptyToUndefined, z.string().optional()),
  revisionRequestNote: z.preprocess(emptyToUndefined, z.string().optional()),
});

// Keeps Enquiry.status in sync with the quote lifecycle — both enums were
// designed together (Stage A–D already included QUOTE_PREPARATION,
// QUOTE_SENT, CLIENT_REVIEW, APPROVED, DECLINED on EnquiryStatus precisely
// for this) so admin isn't maintaining two status fields by hand.
const enquiryStatusForQuoteStatus: Partial<Record<QuoteStatus, EnquiryStatus>> = {
  SENT: "QUOTE_SENT",
  REVISION_REQUESTED: "CLIENT_REVIEW",
  ACCEPTED: "APPROVED",
  DECLINED: "DECLINED",
};

export async function updateQuoteStatus(quoteId: string, formData: FormData) {
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });
  const now = new Date();

  const updateData: Prisma.QuoteUpdateInput = { status: data.status };

  if (data.status === "ACCEPTED") {
    updateData.acceptedAt = now;
    updateData.acceptedBy = data.actedBy;
  }

  if (data.status === "DECLINED") {
    updateData.declinedAt = now;
    updateData.declinedBy = data.actedBy;
    updateData.declineReason = data.declineReason;
  }

  if (data.status === "REVISION_REQUESTED") {
    updateData.revisionRequestedAt = now;
    updateData.revisionRequestNote = data.revisionRequestNote;
    updateData.version = { increment: 1 };
  }

  // Previously three bare sequential awaits (a pre-existing latent
  // consistency bug: a crash between the quote update and the enquiry
  // update left inconsistent state) — now one transaction, which also lets
  // the audit record commit atomically with the state change itself.
  const enquiryStatus = enquiryStatusForQuoteStatus[data.status];
  const operations: Prisma.PrismaPromise<unknown>[] = [];

  if (data.status === "REVISION_REQUESTED") {
    operations.push(
      prisma.quoteRevision.create({
        data: {
          quoteId,
          versionNumber: quote.version,
          requestedNote: data.revisionRequestNote,
          changedBy: data.actedBy || "client",
        },
      }),
    );
  }

  operations.push(prisma.quote.update({ where: { id: quoteId }, data: updateData }));

  if (enquiryStatus) {
    operations.push(prisma.enquiry.update({ where: { id: quote.enquiryId }, data: { status: enquiryStatus } }));
  }

  operations.push(
    auditEventQuery({
      actorType: "ADMIN",
      actorId: "admin",
      action: "quote.status_changed",
      entityType: "Quote",
      entityId: quoteId,
      outcome: "SUCCESS",
      beforeValue: quote.status,
      afterValue: data.status,
      summary: `Quote ${quote.quoteNumber} status changed from ${quote.status} to ${data.status}`,
    }),
  );

  await prisma.$transaction(operations);

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/enquiries/${quote.enquiryId}`);
}

export async function sendQuoteEmail(
  quoteId: string,
  _prevState: SendEmailFormState,
  formData: FormData,
): Promise<SendEmailFormState> {
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return { status: "error", message: "Missing request id — please reload the page and try again." };

  const quote = await getQuoteDetail(quoteId);
  if (!quote) return { status: "error", message: "Quote not found." };

  if (!isQuoteSendable(quote.status)) {
    return { status: "error", message: `A quote in ${quote.status.replaceAll("_", " ")} status cannot be emailed to the client.` };
  }

  const client = quote.enquiry.client;

  const result = await sendTrackedEmail({
    type: "QUOTE_ISSUED",
    recipientEmail: client.email,
    relatedRecordType: "Quote",
    relatedRecordId: quoteId,
    relatedRecordVersion: quote.version,
    idempotencyKey: `quote-issued:${quoteId}:${requestId}`,
    buildMessage: async () => {
      const doc = await getQuoteDocumentForAdmin(quoteId);
      if (!doc) throw new Error("Quote document could not be built.");
      const pdf = await renderPdfBuffer(QuotePdf({ doc }));
      const template = quoteIssuedEmail(client.fullName, quote.quoteNumber, quote.version, appUrl("/portal/quote"));
      return { to: client.email, ...template, attachments: [{ filename: doc.filename, content: pdf }] };
    },
  });

  revalidatePath(`/admin/quotes/${quoteId}`);

  // "duplicate" maps to SUCCESS — the underlying email genuinely was sent
  // on the original attempt; this call was just a double-click/retry.
  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: "admin",
    action: "email.quote_issued",
    entityType: "Quote",
    entityId: quoteId,
    outcome: result.status === "failed" ? "FAILURE" : "SUCCESS",
    correlationId: result.deliveryId,
    summary: `Quote ${quote.quoteNumber} emailed to ${client.email}${result.status === "failed" ? ` (failed: ${result.message ?? "unknown error"})` : ""}`,
  });

  if (result.status === "failed") {
    return { status: "error", message: `Failed to send: ${result.message ?? "unknown error"}` };
  }
  return { status: "success", message: `Quote sent to ${client.email}.` };
}
