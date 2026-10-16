"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getInvoiceDetailForClient, getClientProfile } from "@/lib/client-portal/data";
import { isInvoiceOnlinePayable } from "@/lib/invoices/payment-guard";
import { computeInvoiceAmountDue } from "@/lib/payments/amount-due";
import { getPaymentProvider } from "@/lib/payments/get-provider";
import { generateReferenceNumber } from "@/lib/enquiries/reference";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { auditEventQuery, recordAuditEvent } from "@/lib/audit/log";
import { appUrl } from "@/lib/email/templates";
import type { SendEmailFormState } from "@/lib/email/send-email-state";

// Lazily expire a stale in-flight attempt (no job runner exists anywhere in
// this repo — this is the on-demand equivalent). Only ever touches this
// client's own attempt, found via the ownership-scoped invoiceId the
// caller already validated.
async function expireStaleAttempt(invoiceId: string): Promise<void> {
  const STALE_AFTER_MS = 30 * 60 * 1000;
  const stale = await prisma.payment.findFirst({
    where: { invoiceId, provider: { not: null }, status: { in: ["PENDING", "PROCESSING"] } },
  });
  if (stale && Date.now() - stale.createdAt.getTime() > STALE_AFTER_MS) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: stale.id }, data: { status: "CANCELLED", updatedBy: "system" } }),
      prisma.paymentStatusHistory.create({
        data: { paymentId: stale.id, previousStatus: stale.status, newStatus: "CANCELLED", changedBy: "system", note: "Expired — no confirmation received." },
      }),
      auditEventQuery({
        actorType: "SYSTEM",
        actorId: "system",
        action: "payment.online_verified",
        entityType: "Payment",
        entityId: stale.id,
        outcome: "SUCCESS",
        summary: "Stale online payment attempt lazily expired to CANCELLED",
      }),
    ]);
  }
}

export async function payInvoice(invoiceId: string, _prevState: SendEmailFormState, _formData: FormData): Promise<SendEmailFormState> {
  const clientId = await requireAuthenticatedClientId();

  // Ownership-scoped — never a raw prisma.payment/invoice lookup by id alone.
  const invoice = await getInvoiceDetailForClient(clientId, invoiceId);
  if (!invoice) return { status: "error", message: "Invoice not found." };

  if (!isInvoiceOnlinePayable(invoice.status)) {
    return { status: "error", message: `An invoice in ${invoice.status.replaceAll("_", " ")} status cannot be paid online.` };
  }

  const invoicePayments = invoice.booking.payments.filter((p) => p.invoiceId === invoice.id);
  const { amountDue } = computeInvoiceAmountDue({
    invoiceTotal: invoice.total,
    invoicePayments,
    bookingAgreedTotal: invoice.booking.agreedTotal,
    bookingPayments: invoice.booking.payments,
  });
  // Never trusts any client-submitted amount — none is ever read from the
  // form; this is the only amount that will ever be sent to the provider.
  if (amountDue <= 0) {
    return { status: "error", message: "There is nothing outstanding to pay on this invoice." };
  }
  if (!invoice.currency) {
    return { status: "error", message: "This invoice has no currency set — contact Moira Events before paying online." };
  }

  await expireStaleAttempt(invoiceId);

  const client = await getClientProfile(clientId);
  if (!client) return { status: "error", message: "Client profile not found." };

  // Atomic create + catch-P2002 (not check-then-act) — a race between two
  // simultaneous clicks/tabs is resolved by the partial unique index
  // Payment_one_inflight_per_invoice, not by a prior read.
  let payment: { id: string; reference: string | null } | null = null;
  for (let attempt = 0; attempt < 3 && !payment; attempt++) {
    const reference = generateReferenceNumber("MR");
    try {
      payment = await prisma.payment.create({
        data: {
          bookingId: invoice.booking.id,
          invoiceId: invoice.id,
          amount: amountDue,
          currency: invoice.currency,
          status: "PENDING",
          provider: "flutterwave",
          reference,
          createdBy: clientId,
        },
      });
    } catch (err) {
      if (isUniqueConstraintError(err, "online_reference")) continue; // reference collision — retry with a fresh one
      if (isUniqueConstraintError(err, "inflight")) {
        // Another attempt is already in flight for this invoice — reuse it
        // instead of creating a duplicate (this IS the double-click guard).
        payment = await prisma.payment.findFirst({
          where: { invoiceId: invoice.id, provider: { not: null }, status: { in: ["PENDING", "PROCESSING"] } },
        });
        break;
      }
      throw err;
    }
  }
  if (!payment) return { status: "error", message: "Could not start a payment attempt — please try again." };

  await recordAuditEvent({
    actorType: "CLIENT",
    actorId: clientId,
    action: "payment.online_initiated",
    entityType: "Payment",
    entityId: payment.id,
    outcome: "SUCCESS",
    summary: `Online payment initiated for invoice ${invoice.invoiceNumber}`,
  });

  const provider = getPaymentProvider();
  const checkout = await provider.initiateCheckout({
    reference: payment.reference ?? "",
    amount: amountDue,
    currency: invoice.currency,
    customerEmail: client.email,
    customerName: client.fullName,
    redirectUrl: appUrl(`/portal/invoices/${invoiceId}/payment-return?reference=${encodeURIComponent(payment.reference ?? "")}`),
  });

  if (!checkout.ok) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", updatedBy: "system", notes: "Checkout initiation failed." } });
    return { status: "error", message: "Could not start checkout — please try again shortly." };
  }

  redirect(checkout.checkoutUrl);
}
