import Link from "next/link";
import type { Metadata } from "next";
import { getFunnelReport } from "@/lib/analytics/funnel";
import { BarChart } from "@/lib/analytics/chart";

export const metadata: Metadata = { title: "Sales Funnel — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAnalyticsFunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from ?? "";
  const to = params.to ?? "";

  const report = await getFunnelReport({ from, to });
  const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-espresso-700">Sales Funnel</h1>
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
          <Link href="/admin/analytics/funnel" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
        <a
          href={`/admin/analytics/funnel/export${query ? `?${query}` : ""}`}
          className="text-sm text-espresso-600 hover:underline"
        >
          Download CSV
        </a>
      </form>

      <p className="mb-6 max-w-3xl text-sm text-ink/60">{report.methodologyNote}</p>

      <div className="mb-8 overflow-x-auto rounded-xl border border-espresso-100">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Count</th>
              <th className="px-4 py-3">% of enquiries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-espresso-100">
            {report.stages.map((s) => (
              <tr key={s.key}>
                <td className="px-4 py-3">{s.label}</td>
                <td className="px-4 py-3">{s.count}</td>
                <td className="px-4 py-3">{s.percentOfEnquiries.toFixed(1)}%</td>
              </tr>
            ))}
            <tr>
              <td className="px-4 py-3 text-ink/60">Lost / declined (not a funnel stage)</td>
              <td className="px-4 py-3 text-ink/60">{report.lost}</td>
              <td className="px-4 py-3 text-ink/60">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-8 rounded-xl border border-espresso-100 p-4">
        <BarChart data={report.stages.map((s) => ({ label: s.label, value: s.count }))} />
      </div>

      <h2 className="mb-3 font-serif text-lg text-espresso-700">Consultations (separate intake path)</h2>
      <p className="mb-3 max-w-3xl text-sm text-ink/60">
        Consultations have no relation to enquiries in the data model, so they are reported here on their own, not
        as a funnel stage.
      </p>
      {report.consultations.length === 0 ? (
        <p className="text-sm text-ink/60">No consultations in range.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {report.consultations.map((c) => (
            <li key={c.status}>
              {c.status.replaceAll("_", " ")}: {c.count}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
