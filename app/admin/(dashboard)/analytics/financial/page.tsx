import Link from "next/link";
import type { Metadata } from "next";
import { getFinancialReport, type CurrencyAmount } from "@/lib/analytics/financial";
import { BarChart } from "@/lib/analytics/chart";

export const metadata: Metadata = { title: "Financial Report — Moira Events Admin" };
export const dynamic = "force-dynamic";

function money(amount: number) {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CurrencyTable({ title, rows }: { title: string; rows: CurrencyAmount[] }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 font-serif text-lg text-espresso-700">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/60">No data in range.</p>
      ) : (
        <>
          <div className="mb-3 overflow-x-auto rounded-xl border border-espresso-100">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
                <tr>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-100">
                {rows.map((r) => (
                  <tr key={r.currency}>
                    <td className="px-4 py-3">{r.currency}</td>
                    <td className="px-4 py-3">{money(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-espresso-100 p-4">
            <BarChart data={rows.map((r) => ({ label: r.currency, value: r.amount }))} />
          </div>
        </>
      )}
    </div>
  );
}

export default async function AdminAnalyticsFinancialPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from ?? "";
  const to = params.to ?? "";

  const report = await getFinancialReport({ from, to });
  const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-espresso-700">Financial Report</h1>
        <Link href="/admin/analytics" className="text-sm text-espresso-600 hover:underline">
          Back to overview
        </Link>
      </div>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="from">From</label>
          <input className="field-input w-auto" id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div>
          <label className="field-label" htmlFor="to">To</label>
          <input className="field-input w-auto" id="to" name="to" type="date" defaultValue={to} />
        </div>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {(from || to) && (
          <Link href="/admin/analytics/financial" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
        <a
          href={`/admin/analytics/financial/export${query ? `?${query}` : ""}`}
          className="text-sm text-espresso-600 hover:underline"
        >
          Download CSV
        </a>
      </form>

      <p className="mb-8 max-w-3xl text-sm text-ink/60">{report.disclaimer}</p>

      <CurrencyTable title="Booked value" rows={report.bookedValue} />
      <CurrencyTable title="Invoiced value" rows={report.invoicedValue} />
      <CurrencyTable title="Payments received" rows={report.paymentsReceived} />
      <CurrencyTable title="Refunds issued" rows={report.refundsIssued} />
      <CurrencyTable title="Outstanding balance (as of now)" rows={report.outstandingBalance} />
    </div>
  );
}
