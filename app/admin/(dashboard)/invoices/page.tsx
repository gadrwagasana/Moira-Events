import Link from "next/link";
import type { Metadata } from "next";
import { getInvoicesList } from "@/lib/invoices/data";
import { computePaymentSummary } from "@/lib/payments/totals";
import { InvoiceStatus } from "@/lib/generated/prisma/client";

export const metadata: Metadata = { title: "Invoices — Moira Events Admin" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";

  const invoices = await getInvoicesList({ q, status });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-espresso-700">Invoices</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="q">Search</label>
          <input
            className="field-input w-64"
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Invoice number, booking number, name, or email"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select className="field-input w-auto" id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            {Object.values(InvoiceStatus).map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {(q || status) && (
          <Link href="/admin/invoices" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {invoices.length === 0 ? (
        <p className="text-sm text-ink/60">No invoices match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Outstanding</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {invoices.map((invoice) => {
                const summary = computePaymentSummary(invoice.total, invoice.booking.payments);
                return (
                  <tr key={invoice.id} className="hover:bg-ivory-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/invoices/${invoice.id}`} className="font-medium text-espresso-600 hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${invoice.bookingId}`} className="text-espresso-600 hover:underline">
                        {invoice.booking.bookingNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{invoice.booking.client.fullName}</td>
                    <td className="px-4 py-3">
                      {money(invoice.total)} {invoice.currency ?? ""}
                    </td>
                    <td className="px-4 py-3">
                      {money(summary.outstandingBalance)} {invoice.currency ?? ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                        {invoice.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink/60">{invoice.createdAt.toLocaleDateString()}</td>
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
