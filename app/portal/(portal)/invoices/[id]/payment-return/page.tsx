import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getInvoiceDetailForClient } from "@/lib/client-portal/data";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments/get-provider";
import { applyVerifiedPaymentOutcome } from "@/lib/payments/apply-verified-outcome";

export const metadata: Metadata = { title: "Payment Status — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

// Reachable by anyone with the URL, not just the paying client — ownership
// is re-derived here exactly like every other portal page, never assumed
// from the query string. The query params (status/tx_ref/transaction_id)
// are untrusted hints only, used to know WHICH transaction to check, never
// as proof — the actual outcome always comes from re-querying our own DB
// after a fresh provider verification, never from the URL itself.
export default async function PaymentReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reference?: string; transaction_id?: string }>;
}) {
  const { id } = await params;
  const { reference, transaction_id } = await searchParams;
  const clientId = await requireAuthenticatedClientId();

  const invoice = await getInvoiceDetailForClient(clientId, id);
  if (!invoice) notFound();

  if (reference) {
    const provider = getPaymentProvider();
    const verified = await provider.verifyTransaction({ providerTransactionId: transaction_id, reference });
    await applyVerifiedPaymentOutcome(verified, "return-page", reference);
  }

  // Always render from fresh DB state, never from the query params above.
  const payment = reference
    ? await prisma.payment.findFirst({ where: { reference, invoiceId: invoice.id }, select: { status: true } })
    : null;

  const outcome =
    payment?.status === "PAID"
      ? "paid"
      : payment?.status === "FAILED" || payment?.status === "CANCELLED"
        ? "failed"
        : "pending";

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <h1 className="font-serif text-2xl text-espresso-700">Payment Status</h1>

      {outcome === "paid" && (
        <div className="rounded-xl border border-espresso-200 bg-ivory-50 p-8">
          <p className="font-serif text-xl text-espresso-700">Payment received</p>
          <p className="mt-2 text-sm text-ink/70">Thank you — your payment for invoice {invoice.invoiceNumber} has been confirmed.</p>
        </div>
      )}
      {outcome === "failed" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <p className="font-serif text-xl text-red-700">Payment not completed</p>
          <p className="mt-2 text-sm text-ink/70">Your payment could not be confirmed. No charge should have been made — you can try again from the invoice page.</p>
        </div>
      )}
      {outcome === "pending" && (
        <div className="rounded-xl border border-espresso-200 bg-ivory-50 p-8">
          <p className="font-serif text-xl text-espresso-700">Still confirming...</p>
          <p className="mt-2 text-sm text-ink/70">We&rsquo;re waiting on confirmation from the payment provider. This page is safe to refresh.</p>
          <a href={`/portal/invoices/${invoice.id}/payment-return${reference ? `?reference=${encodeURIComponent(reference)}${transaction_id ? `&transaction_id=${encodeURIComponent(transaction_id)}` : ""}` : ""}`} className="btn-secondary mt-4 inline-flex">
            Refresh Status
          </a>
        </div>
      )}

      <Link href={`/portal/invoices/${invoice.id}`} className="text-sm text-espresso-600 hover:underline">
        Back to invoice
      </Link>
    </div>
  );
}
