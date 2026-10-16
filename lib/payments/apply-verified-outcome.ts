import { prisma } from "@/lib/db";
import { auditEventQuery, recordAuditEvent } from "@/lib/audit/log";
import { computePaymentSummary } from "./totals";
import type { VerifyResult } from "./provider";

// The ONLY place a Payment ever gets marked from a provider result — called
// identically from the webhook route and the checkout-return page, so
// there's exactly one state machine, not two. The provider's
// verifyTransaction() network call must already have happened before this
// is called (never inside a $transaction — Stage N Phase E).
//
// State machine (a real flaw in an earlier draft of this design treated
// FAILED as terminal, which would silently drop a legitimate later
// "successful" result — Flutterwave allows a retry within the same
// checkout session, so a late success CAN genuinely follow an earlier
// failure):
//   - unknown reference                              -> audit FAILURE, no mutation
//   - amount/currency mismatch vs. the stored Payment -> audit FAILURE, no mutation
//   - already PAID, same providerTransactionId        -> no-op, audit SUCCESS ("duplicate")
//   - already PAID, DIFFERENT providerTransactionId    -> no-op, audit SUCCESS ("conflicting event ignored") — never downgrades a PAID row
//   - anything else (PENDING/PROCESSING/FAILED/CANCELLED) -> apply the verified outcome
export async function applyVerifiedPaymentOutcome(
  verified: VerifyResult,
  source: "webhook" | "return-page",
  // Best-effort attribution for the `!verified.ok` audit entry below, since
  // that shape of VerifyResult carries no reference of its own — the caller
  // already knows which reference it asked the provider to verify (Stage P
  // audit finding: this was "unknown" before, making stuck/failed
  // verifications unsearchable in the audit log).
  knownReference?: string,
): Promise<void> {
  if (!verified.ok) {
    await recordAuditEvent({
      actorType: "SYSTEM",
      actorId: "system",
      action: "payment.online_verified",
      entityType: "Payment",
      entityId: knownReference ?? "unknown",
      outcome: "FAILURE",
      summary: `Verification failed via ${source}: ${verified.error}`,
    });
    return;
  }

  const payment = await prisma.payment.findFirst({ where: { reference: verified.reference, provider: { not: null } } });
  if (!payment) {
    await recordAuditEvent({
      actorType: "SYSTEM",
      actorId: "system",
      action: "payment.online_verified",
      entityType: "Payment",
      entityId: verified.reference,
      outcome: "FAILURE",
      correlationId: verified.providerTransactionId,
      summary: `Verified transaction via ${source} does not match any known online payment reference — not applied`,
    });
    return;
  }

  // Never apply a result whose amount/currency don't match what this
  // specific Payment row expects — a mismatch here would mean trusting an
  // unrelated or tampered transaction.
  if (Number(payment.amount) > verified.amount || (payment.currency ?? "") !== verified.currency) {
    await recordAuditEvent({
      actorType: "SYSTEM",
      actorId: "system",
      action: "payment.online_verified",
      entityType: "Payment",
      entityId: payment.id,
      outcome: "FAILURE",
      correlationId: verified.providerTransactionId,
      summary: `Amount/currency mismatch via ${source} (expected ${payment.amount} ${payment.currency}, got ${verified.amount} ${verified.currency}) — not applied`,
    });
    return;
  }

  if (payment.status === "PAID") {
    const isSameTransaction = payment.providerTransactionId === verified.providerTransactionId;
    await recordAuditEvent({
      actorType: "SYSTEM",
      actorId: "system",
      action: "payment.online_verified",
      entityType: "Payment",
      entityId: payment.id,
      outcome: "SUCCESS",
      correlationId: verified.providerTransactionId,
      // A same-reference event with a DIFFERENT providerTransactionId for an
      // already-PAID payment means Flutterwave processed two distinct
      // successful transactions under one tx_ref — a real double-charge on
      // the customer's card that this code correctly refuses to re-apply or
      // double-count, but which a human should actually see. "ALERT:" makes
      // it stand out from routine same-transaction duplicate deliveries when
      // scanning the audit log (Stage P audit finding).
      summary: isSameTransaction
        ? `Duplicate ${source} for an already-PAID payment — no-op`
        : `ALERT: conflicting later ${source} event (different provider transaction) for an already-PAID payment — ignored, not downgraded, but the customer may have been charged twice by the provider`,
    });
    return;
  }

  const newStatus = verified.status === "successful" ? "PAID" : verified.status === "cancelled" ? "CANCELLED" : "FAILED";

  // Re-check invoice eligibility at apply time, not just at initiation —
  // admin could have voided the invoice between checkout start and this
  // verification. The money is still real and must be truthfully recorded;
  // this only flags the conflict for manual review, never silently drops
  // or silently applies it without a trace.
  let invoiceConflictNote = "";
  if (payment.invoiceId && newStatus === "PAID") {
    const invoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId }, select: { status: true } });
    if (invoice && !["DRAFT", "ISSUED", "PARTIALLY_PAID"].includes(invoice.status)) {
      invoiceConflictNote = ` (WARNING: invoice status was ${invoice.status} when payment was confirmed — needs manual review)`;
    }
  }

  // Re-check the booking-level outstanding balance at apply time too, not
  // just at checkout initiation (lib/payments/amount-due.ts's dual-cap only
  // guards the moment a NEW checkout is created). A payment that was PENDING
  // can sit for a long time — long enough for its own 30-minute staleness
  // window to expire and get superseded by a second, fresh payment that is
  // itself completed, after which this original one is later resurrected PAID
  // by a late webhook (only PAID is treated as terminal, by design — see the
  // module comment above). That narrow window could jointly overpay a
  // booking with no apply-time check. This never blocks — the money is real
  // and must still be truthfully recorded — it only flags it for manual
  // review, same philosophy as invoiceConflictNote above (Stage P audit
  // finding).
  let overpaymentNote = "";
  if (newStatus === "PAID") {
    const booking = await prisma.booking.findUnique({
      where: { id: payment.bookingId },
      select: { agreedTotal: true, payments: { select: { status: true, amount: true, refundAmount: true } } },
    });
    if (booking) {
      const outstandingBefore = computePaymentSummary(booking.agreedTotal, booking.payments).outstandingBalance;
      if (verified.amount > outstandingBefore) {
        const excess = (verified.amount - outstandingBefore).toFixed(2);
        overpaymentNote = ` (WARNING: this payment exceeds the booking's outstanding balance by ${excess} — possible overpayment, needs manual review)`;
      }
    }
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        providerTransactionId: verified.providerTransactionId,
        paymentDate: newStatus === "PAID" ? new Date() : payment.paymentDate,
        updatedBy: "system",
      },
    }),
    prisma.paymentStatusHistory.create({
      data: {
        paymentId: payment.id,
        previousStatus: payment.status,
        newStatus,
        changedBy: "system",
        note: `Verified via ${source}.`,
      },
    }),
    auditEventQuery({
      actorType: "SYSTEM",
      actorId: "system",
      action: "payment.online_verified",
      entityType: "Payment",
      entityId: payment.id,
      outcome: "SUCCESS",
      beforeValue: payment.status,
      afterValue: newStatus,
      correlationId: verified.providerTransactionId,
      summary: `Online payment ${newStatus} via ${source}${invoiceConflictNote}${overpaymentNote}`,
    }),
  ]);
}
