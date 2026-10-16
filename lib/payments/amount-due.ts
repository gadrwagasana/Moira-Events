import { computePaymentSummary } from "./totals";

type PaymentLike = Parameters<typeof computePaymentSummary>[1][number];

// Dual-cap, not single-cap (a real money bug in an earlier draft of this
// stage's design): capping only at the invoice-scoped outstanding balance
// does nothing to stop a client paying online for an invoice that a
// pre-existing *booking-level* manual payment already covered — bookings
// can have multiple invoices, and manual payments aren't invoice-tagged
// (Payment.invoiceId is null for all of them). Calls computePaymentSummary
// (lib/payments/totals.ts) TWICE — once per scope — and never allows an
// online payment to exceed either ceiling. No new financial math; this is
// the existing, already-correct function applied to two different
// (correct) slices of the same ledger.
export function computeInvoiceAmountDue(args: {
  invoiceTotal: Parameters<typeof computePaymentSummary>[0];
  invoicePayments: PaymentLike[];
  bookingAgreedTotal: Parameters<typeof computePaymentSummary>[0];
  bookingPayments: PaymentLike[];
}): { amountDue: number; invoiceOutstanding: number; bookingOutstanding: number } {
  const invoiceSummary = computePaymentSummary(args.invoiceTotal, args.invoicePayments);
  const bookingSummary = computePaymentSummary(args.bookingAgreedTotal, args.bookingPayments);
  const amountDue = Math.max(0, Math.min(invoiceSummary.outstandingBalance, bookingSummary.outstandingBalance));
  return {
    amountDue,
    invoiceOutstanding: invoiceSummary.outstandingBalance,
    bookingOutstanding: bookingSummary.outstandingBalance,
  };
}
