import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { BookingStatus, InvoiceStatus, PaymentStatus } from "@/lib/generated/prisma/client";
import { computePaymentSummary, paymentNetReceived } from "@/lib/payments/totals";
import { parseDateRangeWhere, coalescedDateRangeWhere, currencyLabel, type DateRangeParams } from "./date-range";

export const FINANCIAL_DISCLAIMER =
  "Booked value, invoiced value, payments received, and outstanding balance are four distinct figures — they " +
  "must never be added together or treated as interchangeable. Totals are never combined across currencies; " +
  "a booking, invoice, or payment with no currency recorded is shown separately as \"Unspecified currency\". " +
  "Outstanding balance reflects the current moment, not the selected date range (the range only narrows which " +
  "bookings are included); it is computed per booking from the full payment ledger, since historical manual " +
  "payments are not tagged to a specific invoice.";

export type CurrencyAmount = { currency: string; amount: number };

export type FinancialReport = {
  bookedValue: CurrencyAmount[];
  invoicedValue: CurrencyAmount[];
  paymentsReceived: CurrencyAmount[];
  refundsIssued: CurrencyAmount[];
  outstandingBalance: CurrencyAmount[];
  disclaimer: string;
};

function sumByCurrency(rows: { currency: string | null; value: number }[]): CurrencyAmount[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = currencyLabel(row.currency);
    totals.set(key, (totals.get(key) ?? 0) + row.value);
  }
  return [...totals.entries()].map(([currency, amount]) => ({ currency, amount })).sort((a, b) => a.currency.localeCompare(b.currency));
}

export async function getFinancialReport(range: DateRangeParams): Promise<FinancialReport> {
  const bookingWhere = parseDateRangeWhere("createdAt", range);
  const invoiceWhere = parseDateRangeWhere("createdAt", range);
  const receivedWhere = coalescedDateRangeWhere("paymentDate", "createdAt", range);
  const refundWhere = coalescedDateRangeWhere("refundDate", "updatedAt", range);

  // Sequential, not Promise.all — five queries fired at once is exactly the
  // kind of concurrent-connection burst that triggers "Server has closed the
  // connection" against a constrained pool (see the enquiry detail page for
  // the same pattern and rationale).
  const bookings = await withDbRetry(() =>
    prisma.booking.findMany({
      where: { ...bookingWhere, status: { not: BookingStatus.CANCELLED } },
      select: { currency: true, agreedTotal: true },
    }),
  );
  const invoices = await withDbRetry(() =>
    prisma.invoice.findMany({
      where: { ...invoiceWhere, status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID] } },
      select: { currency: true, total: true },
    }),
  );
  const receivedPayments = await withDbRetry(() =>
    prisma.payment.findMany({
      where: { ...receivedWhere, status: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED] } },
      select: { currency: true, amount: true, refundAmount: true, status: true },
    }),
  );
  const refundedPayments = await withDbRetry(() =>
    prisma.payment.findMany({
      where: { ...refundWhere, status: { in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED] } },
      select: { currency: true, refundAmount: true },
    }),
  );
  const outstandingBookings = await withDbRetry(() =>
    prisma.booking.findMany({
      // Same CANCELLED exclusion as the booked-value query above — a
      // cancelled booking's unpaid balance is not a real receivable and
      // must not inflate the portfolio-wide "money owed" figure.
      where: { ...bookingWhere, status: { not: BookingStatus.CANCELLED } },
      select: { currency: true, agreedTotal: true, payments: { select: { status: true, amount: true, refundAmount: true } } },
    }),
  );

  const bookedValue = sumByCurrency(bookings.map((b) => ({ currency: b.currency, value: Number(b.agreedTotal ?? 0) })));
  const invoicedValue = sumByCurrency(invoices.map((i) => ({ currency: i.currency, value: Number(i.total ?? 0) })));
  const paymentsReceived = sumByCurrency(receivedPayments.map((p) => ({ currency: p.currency, value: paymentNetReceived(p) })));
  const refundsIssued = sumByCurrency(refundedPayments.map((p) => ({ currency: p.currency, value: Number(p.refundAmount ?? 0) })));
  const outstandingBalance = sumByCurrency(
    outstandingBookings.map((b) => ({
      // Clamped at 0 per booking before summing — an overpayment on one
      // booking must never net against (and understate) genuine amounts
      // owed on another booking in the same currency bucket.
      currency: b.currency,
      value: Math.max(0, computePaymentSummary(b.agreedTotal, b.payments).outstandingBalance),
    })),
  );

  return { bookedValue, invoicedValue, paymentsReceived, refundsIssued, outstandingBalance, disclaimer: FINANCIAL_DISCLAIMER };
}
