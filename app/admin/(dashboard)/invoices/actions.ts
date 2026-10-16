"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma, InvoiceStatus } from "@/lib/generated/prisma/client";
import { generateReferenceNumber } from "@/lib/enquiries/reference";
// Generic line-item subtotal/discount/tax/total math — not duplicated here;
// InvoiceItem has the same {quantity, unitPrice} shape QuoteItem does, and
// this already clamps negative totals to 0 (Stage H §12).
import { computeQuoteTotals } from "@/lib/quotes/totals";
import { isValidTransition } from "@/lib/invoices/transitions";
import { getInvoiceDetail } from "@/lib/invoices/data";
import { getInvoiceDocumentForAdmin } from "@/lib/documents/invoice";
import { InvoicePdf } from "@/lib/documents/invoice-pdf";
import { renderPdfBuffer } from "@/lib/documents/render";
import { formatCurrencyLine } from "@/lib/documents/format";
import { invoiceIssuedEmail, appUrl } from "@/lib/email/templates";
import { sendTrackedEmail, type SendEmailFormState } from "@/lib/email/outbox";
import { isInvoiceSendable } from "@/lib/invoices/send-guard";
import { auditEventQuery, recordAuditEvent } from "@/lib/audit/log";
import { isUniqueConstraintError } from "@/lib/prisma-errors";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

// Accepts a transaction client so every item-mutating action below can
// compose this with its own item write inside one atomic unit (Stage P audit
// finding: these were previously two separate sequential awaits, so a crash
// between them could leave Invoice.subtotal/total stale relative to the
// actual line items on a document a client can view/pay against).
async function recalcInvoiceTotals(invoiceId: string, tx: Prisma.TransactionClient) {
  const [items, invoice] = await Promise.all([
    tx.invoiceItem.findMany({ where: { invoiceId } }),
    tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } }),
  ]);
  const { subtotal, totalAmount } = computeQuoteTotals(items, invoice.discount, invoice.tax);
  await tx.invoice.update({ where: { id: invoiceId }, data: { subtotal, total: totalAmount } });
}

// Invoices are snapshotted from Booking.services (itself already a frozen
// snapshot of the accepted quote, Stage F) — never from the live Quote or
// Service catalogue (Stage H §7). Multiple invoices per booking are allowed
// (§9), so this is never gated the way Booking's "Create Booking" was.
export async function createInvoiceFromBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { services: true },
  });
  if (!booking) throw new Error("Booking not found");

  const { subtotal, totalAmount } = computeQuoteTotals(booking.services);

  let invoiceId: string | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    const invoiceNumber = generateReferenceNumber("MI");
    try {
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          bookingId: booking.id,
          currency: booking.currency,
          subtotal,
          total: totalAmount,
          createdBy: "admin",
          items: {
            create: booking.services.map((s, i) => ({
              serviceId: s.serviceId,
              description: s.description,
              quantity: s.quantity,
              unitPrice: s.unitPrice,
              lineTotal: s.total,
              sortOrder: i,
            })),
          },
          statusHistory: {
            create: {
              previousStatus: null,
              newStatus: "DRAFT",
              changedBy: "admin",
              note: "Invoice created from booking.",
            },
          },
        },
      });
      invoiceId = invoice.id;
      break;
    } catch (err) {
      if (!isUniqueConstraintError(err, "invoiceNumber")) throw err;
      // else loop and retry with a freshly generated invoice number
    }
  }

  if (!invoiceId) throw new Error("Could not generate a unique invoice number");

  revalidatePath(`/admin/bookings/${bookingId}`);
  redirect(`/admin/invoices/${invoiceId}`);
}

const detailsSchema = z.object({
  issueDate: z.preprocess(emptyToUndefined, z.string().optional()),
  dueDate: z.preprocess(emptyToUndefined, z.string().optional()),
  currency: z.preprocess(emptyToUndefined, z.string().optional()),
  discount: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  tax: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  clientNotes: z.preprocess(emptyToUndefined, z.string().optional()),
  internalNotes: z.preprocess(emptyToUndefined, z.string().optional()),
  terms: z.preprocess(emptyToUndefined, z.string().optional()),
});

// Draft-only (Stage H §20) — an issued financial document is never silently
// rewritten; re-checked here even though the UI only renders this form for
// DRAFT invoices.
export async function updateInvoiceDetails(invoiceId: string, formData: FormData) {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.status !== "DRAFT") return;

  const parsed = detailsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  const items = await prisma.invoiceItem.findMany({ where: { invoiceId } });
  const { subtotal, totalAmount } = computeQuoteTotals(items, data.discount, data.tax);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      issueDate: data.issueDate ? new Date(data.issueDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      currency: data.currency,
      discount: data.discount,
      tax: data.tax,
      clientNotes: data.clientNotes,
      internalNotes: data.internalNotes,
      terms: data.terms,
      subtotal,
      total: totalAmount,
      updatedBy: "admin",
    },
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
}

const addItemSchema = z
  .object({
    // References a BookingService (what was actually agreed) — not the live
    // Service catalogue — so the snapshot stays accurate (§7).
    bookingServiceId: z.preprocess(emptyToUndefined, z.string().optional()),
    description: z.preprocess(emptyToUndefined, z.string().optional()),
    quantity: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()).default(1),
    unitPrice: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  })
  .refine((data) => data.bookingServiceId || data.description, {
    message: "Select a service or enter a description",
    path: ["description"],
  });

export async function addInvoiceItem(invoiceId: string, formData: FormData) {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.status !== "DRAFT") return;

  const parsed = addItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  let description = data.description;
  let quantity = data.quantity;
  let unitPrice = data.unitPrice;
  let serviceId: string | undefined;

  if (data.bookingServiceId) {
    const bs = await prisma.bookingService.findUnique({ where: { id: data.bookingServiceId } });
    if (!bs) return;
    description = bs.description;
    quantity = bs.quantity ?? 1;
    unitPrice = bs.unitPrice != null ? Number(bs.unitPrice) : undefined;
    serviceId = bs.serviceId ?? undefined;
  }
  if (!description) return;

  const lineTotal = unitPrice != null ? quantity * unitPrice : null;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.invoiceItem.findMany({ where: { invoiceId } });
    await tx.invoiceItem.create({
      data: {
        invoiceId,
        serviceId,
        description,
        quantity,
        unitPrice,
        lineTotal,
        sortOrder: existing.length,
      },
    });
    await recalcInvoiceTotals(invoiceId, tx);
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
}

const updateItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()).default(1),
  unitPrice: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
});

export async function updateInvoiceItem(itemId: string, invoiceId: string, formData: FormData) {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.status !== "DRAFT") return;

  const parsed = updateItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;
  const lineTotal = data.unitPrice != null ? data.quantity * data.unitPrice : null;

  await prisma.$transaction(async (tx) => {
    // Compound where (not just `id`) so an item can only ever be edited
    // through its own invoice's form — Stage H §25.
    await tx.invoiceItem.updateMany({
      where: { id: itemId, invoiceId },
      data: { description: data.description, quantity: data.quantity, unitPrice: data.unitPrice, lineTotal },
    });
    await recalcInvoiceTotals(invoiceId, tx);
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
}

export async function deleteInvoiceItem(itemId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.status !== "DRAFT") return;

  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { id: itemId, invoiceId } });
    await recalcInvoiceTotals(invoiceId, tx);
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
}

const statusSchema = z.object({
  status: z.nativeEnum(InvoiceStatus),
  changedBy: z.preprocess(emptyToUndefined, z.string().optional()),
  note: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function updateInvoiceStatus(invoiceId: string, formData: FormData) {
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });

  if (!isValidTransition(invoice.status, data.status)) return;

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: data.status, updatedBy: data.changedBy },
    }),
    prisma.invoiceStatusHistory.create({
      data: {
        invoiceId,
        previousStatus: invoice.status,
        newStatus: data.status,
        changedBy: data.changedBy,
        note: data.note,
      },
    }),
    auditEventQuery({
      actorType: "ADMIN",
      actorId: "admin",
      action: "invoice.status_changed",
      entityType: "Invoice",
      entityId: invoiceId,
      outcome: "SUCCESS",
      beforeValue: invoice.status,
      afterValue: data.status,
      summary: `Invoice ${invoice.invoiceNumber} status changed from ${invoice.status} to ${data.status}`,
    }),
  ]);

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath(`/admin/bookings/${invoice.bookingId}`);
}

export async function sendInvoiceEmail(
  invoiceId: string,
  _prevState: SendEmailFormState,
  formData: FormData,
): Promise<SendEmailFormState> {
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return { status: "error", message: "Missing request id — please reload the page and try again." };

  const invoice = await getInvoiceDetail(invoiceId);
  if (!invoice) return { status: "error", message: "Invoice not found." };

  if (!isInvoiceSendable(invoice.status)) {
    return { status: "error", message: `An invoice in ${invoice.status.replaceAll("_", " ")} status cannot be emailed to the client.` };
  }

  const client = invoice.booking.client;

  const result = await sendTrackedEmail({
    type: "INVOICE_ISSUED",
    recipientEmail: client.email,
    relatedRecordType: "Invoice",
    relatedRecordId: invoiceId,
    idempotencyKey: `invoice-issued:${invoiceId}:${requestId}`,
    buildMessage: async () => {
      const doc = await getInvoiceDocumentForAdmin(invoiceId);
      if (!doc) throw new Error("Invoice document could not be built.");
      const pdf = await renderPdfBuffer(InvoicePdf({ doc }));
      const totalFormatted = formatCurrencyLine(doc.total, doc.currency);
      const template = invoiceIssuedEmail(client.fullName, invoice.invoiceNumber, totalFormatted, appUrl(`/portal/invoices/${invoiceId}`));
      return { to: client.email, ...template, attachments: [{ filename: doc.filename, content: pdf }] };
    },
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);

  await recordAuditEvent({
    actorType: "ADMIN",
    actorId: "admin",
    action: "email.invoice_issued",
    entityType: "Invoice",
    entityId: invoiceId,
    outcome: result.status === "failed" ? "FAILURE" : "SUCCESS",
    correlationId: result.deliveryId,
    summary: `Invoice ${invoice.invoiceNumber} emailed to ${client.email}${result.status === "failed" ? ` (failed: ${result.message ?? "unknown error"})` : ""}`,
  });

  if (result.status === "failed") {
    return { status: "error", message: `Failed to send: ${result.message ?? "unknown error"}` };
  }
  return { status: "success", message: `Invoice sent to ${client.email}.` };
}
