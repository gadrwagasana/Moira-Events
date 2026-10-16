import { Prisma } from "@/lib/generated/prisma/client";

type PaymentLike = {
  status: string;
  amount: Prisma.Decimal | number | string;
  refundAmount?: Prisma.Decimal | number | string | null;
};

export type PaymentSummaryState = "NOT_PAID" | "PARTIALLY_PAID" | "PAID" | "OVERPAID";

export type PaymentSummary = {
  totalPaid: number;
  outstandingBalance: number;
  isOverpaid: boolean;
  state: PaymentSummaryState;
};

// A single payment's net contribution toward "money actually received":
// PAID counts in full; PARTIALLY_REFUNDED counts net of the refunded
// amount; REFUNDED counts zero UNCONDITIONALLY (never re-reads
// refundAmount — a fully-refunded payment is fully reversed regardless of
// whether that field was filled in); PENDING/PROCESSING/FAILED/CANCELLED
// contribute nothing. Factored out of computePaymentSummary (Stage O) so
// any other aggregate (e.g. the analytics financial report) can never
// drift from this app's one authoritative definition of "received".
export function paymentNetReceived(p: PaymentLike): number {
  if (p.status === "PAID") return Number(p.amount);
  if (p.status === "PARTIALLY_REFUNDED") return Number(p.amount) - Number(p.refundAmount ?? 0);
  return 0;
}

// Outstanding Balance = Agreed Amount − Total Successful Payments (Stage G
// §7). Never performs currency conversion — the caller is responsible for
// only passing payments that share the booking's currency if that matters
// for its use case (Stage G §15).
export function computePaymentSummary(
  agreedTotal: Prisma.Decimal | number | string | null | undefined,
  payments: PaymentLike[],
): PaymentSummary {
  const totalPaid = payments.reduce((sum, p) => sum + paymentNetReceived(p), 0);

  const agreed = agreedTotal != null ? Number(agreedTotal) : 0;
  const outstandingBalance = agreed - totalPaid;
  const isOverpaid = agreed > 0 && totalPaid > agreed;

  let state: PaymentSummaryState;
  if (totalPaid <= 0) state = "NOT_PAID";
  else if (isOverpaid) state = "OVERPAID";
  else if (agreed > 0 && totalPaid >= agreed) state = "PAID";
  else state = "PARTIALLY_PAID";

  return { totalPaid, outstandingBalance, isOverpaid, state };
}
