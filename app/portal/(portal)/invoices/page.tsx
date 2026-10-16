import Link from "next/link";
import type { Metadata } from "next";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getInvoicesForClient } from "@/lib/client-portal/data";
import { computePaymentSummary } from "@/lib/payments/totals";

export const metadata: Metadata = { title: "Invoices — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PortalInvoicesPage() {
  const clientId = await requireAuthenticatedClientId();
  const invoices = await getInvoicesForClient(clientId);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl text-espresso-700">Invoices</h1>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-espresso-100 bg-ivory-50 p-8 text-center">
          <p className="text-sm text-ink/60">No invoice has been issued yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Outstanding</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {invoices.map((invoice) => {
                const summary = computePaymentSummary(invoice.total, invoice.booking.payments);
                const hasMultiple = invoice.booking._count.invoices > 1;
                return (
                  <tr key={invoice.id} className="hover:bg-ivory-50">
                    <td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-ink/60">
                      {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                        {invoice.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {money(invoice.total)} {invoice.currency ?? ""}
                    </td>
                    <td className="px-4 py-3">
                      {hasMultiple ? "—" : `${money(summary.outstandingBalance)} ${invoice.currency ?? ""}`}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/portal/invoices/${invoice.id}`} className="text-espresso-600 hover:underline">
                        View Invoice
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
