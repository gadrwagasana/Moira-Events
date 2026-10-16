import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getInvoiceDetailForClient } from "@/lib/client-portal/data";
import { prisma } from "@/lib/db";
import { computePaymentSummary } from "@/lib/payments/totals";
import { computeInvoiceAmountDue } from "@/lib/payments/amount-due";
import { isInvoiceOnlinePayable } from "@/lib/invoices/payment-guard";
import { PayInvoiceButton } from "./PayInvoiceButton";

export const metadata: Metadata = { title: "Invoice Detail — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PortalInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = await requireAuthenticatedClientId();
  const invoice = await getInvoiceDetailForClient(clientId, id);
  if (!invoice) notFound();

  const paymentSummary = computePaymentSummary(invoice.total, invoice.booking.payments);
  const hasMultipleInvoices = invoice.booking._count.invoices > 1;

  const invoicePayments = invoice.booking.payments.filter((p) => p.invoiceId === invoice.id);
  const { amountDue } = computeInvoiceAmountDue({
    invoiceTotal: invoice.total,
    invoicePayments,
    bookingAgreedTotal: invoice.booking.agreedTotal,
    bookingPayments: invoice.booking.payments,
  });
  const canPayOnline = isInvoiceOnlinePayable(invoice.status) && amountDue > 0;
  // Ownership is already established above via getInvoiceDetailForClient —
  // this is a display-only lookup scoped to that same already-verified
  // invoice id, not a new access path.
  const lastOnlinePayment = await prisma.payment.findFirst({
    where: { invoiceId: invoice.id, provider: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">{invoice.invoiceNumber}</p>
          <h1 className="font-serif text-2xl text-espresso-700">Invoice</h1>
          <p className="text-sm text-ink/60">Booking {invoice.booking.bookingNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-espresso-100 px-3 py-1.5 text-sm font-medium text-espresso-700">
            {invoice.status.replaceAll("_", " ")}
          </span>
          <a href={`/portal/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Download PDF
          </a>
        </div>
      </div>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Row label="Issue Date" value={invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : undefined} />
          <Row label="Due Date" value={invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : undefined} />
        </dl>
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Items</h2>
        {invoice.items.length === 0 ? (
          <p className="text-sm text-ink/50">No items on file.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-espresso-200 text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-2 pr-3">Description</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Unit Price</th>
                  <th className="py-2 pr-3">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-100">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-3">{item.description}</td>
                    <td className="py-2 pr-3">{item.quantity ?? 1}</td>
                    <td className="py-2 pr-3">{money(item.unitPrice)}</td>
                    <td className="py-2 pr-3">{money(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-ivory-100 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Subtotal</span>
            <span>{money(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Discount</span>
            <span>{money(invoice.discount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Tax</span>
            <span>{money(invoice.tax)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-espresso-200 pt-2 text-base font-semibold text-espresso-700">
            <span>Total</span>
            <span>
              {money(invoice.total)} {invoice.currency ?? ""}
            </span>
          </div>
        </div>

        {invoice.clientNotes && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{invoice.clientNotes}</p>
          </div>
        )}
        {invoice.terms && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Terms</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{invoice.terms}</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Payment Summary</h2>
        <div className="rounded-lg bg-ivory-100 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Invoice Total</span>
            <span>
              {money(invoice.total)} {invoice.currency ?? ""}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Total Paid</span>
            <span>
              {money(paymentSummary.totalPaid)} {invoice.currency ?? ""}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-espresso-200 pt-2 text-base font-semibold text-espresso-700">
            <span>Outstanding Balance</span>
            <span>
              {money(paymentSummary.outstandingBalance)} {invoice.currency ?? ""}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink/50">
          Payments are recorded against your booking as a whole, not allocated to individual invoices.
          {hasMultipleInvoices &&
            " You have more than one invoice on this booking — the figures above reflect all payments on the booking, not a per-invoice split."}
        </p>

        {canPayOnline && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-espresso-200 bg-ivory-50 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Amount Due Online</p>
              <p className="font-serif text-xl text-espresso-700">
                {money(amountDue)} {invoice.currency}
              </p>
            </div>
            <PayInvoiceButton invoiceId={invoice.id} />
          </div>
        )}
        {lastOnlinePayment && (
          <p className="mt-3 text-xs text-ink/50">
            Last online payment attempt: {lastOnlinePayment.createdAt.toLocaleString()} —{" "}
            {lastOnlinePayment.status.replaceAll("_", " ")}
          </p>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/50">{label}</dt>
      <dd className="text-right text-ink/80">{value || "—"}</dd>
    </div>
  );
}
