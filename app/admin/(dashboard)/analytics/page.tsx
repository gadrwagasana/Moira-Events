import Link from "next/link";
import type { Metadata } from "next";
import { getFunnelReport } from "@/lib/analytics/funnel";
import { getFinancialReport } from "@/lib/analytics/financial";
import { getUpcomingEvents, getPlanningRequestAges, getRecentActivity } from "@/lib/analytics/operational";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Analytics — Moira Events Admin" };
export const dynamic = "force-dynamic";

function money(amount: number) {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-espresso-100 p-4">
      <p className="text-xs uppercase tracking-wide text-ink/60">{label}</p>
      <p className="mt-1 font-serif text-2xl text-espresso-700">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}

export default async function AdminAnalyticsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdminRole("ADMIN");
  const params = await searchParams;
  const from = params.from ?? "";
  const to = params.to ?? "";

  // Sequential, not Promise.all — this page is the heaviest aggregator in
  // the admin (funnel + financial reports alone fire 11 queries between
  // them); running all five report calls at once was exactly the kind of
  // concurrent-connection burst that triggers "Server has closed the
  // connection" against a constrained pool. Each underlying query already
  // retries transient failures on its own (see lib/analytics/funnel.ts and
  // lib/analytics/financial.ts), so this just avoids piling them up at once.
  const funnel = await getFunnelReport({ from, to });
  const financial = await getFinancialReport({ from, to });
  const upcomingEvents = await getUpcomingEvents(60);
  const planningAges = await getPlanningRequestAges();
  const recentActivity = await getRecentActivity(15);

  const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  const withQuery = (path: string) => `${path}${query ? `?${query}` : ""}`;

  const enquiriesStage = funnel.stages.find((s) => s.key === "enquiries");
  const bookedStage = funnel.stages.find((s) => s.key === "booked");

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl text-espresso-700">Analytics</h1>
      <p className="mb-6 max-w-3xl text-sm text-ink/60">
        Read-only reporting. Figures are never combined across currencies, and booked value, invoiced value,
        payments received, and outstanding balance are always kept as separate figures — see the Financial Report
        for the full breakdown and its disclaimer.
      </p>

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
          <Link href="/admin/analytics" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Enquiries" value={String(enquiriesStage?.count ?? 0)} hint="in selected range" />
        <KpiCard label="Booked" value={String(bookedStage?.count ?? 0)} hint="in selected range" />
        <KpiCard
          label="Payments received"
          value={financial.paymentsReceived.length === 0 ? "—" : financial.paymentsReceived.map((r) => `${money(r.amount)} ${r.currency}`).join(" · ")}
        />
        <KpiCard
          label="Outstanding (now)"
          value={financial.outstandingBalance.length === 0 ? "—" : financial.outstandingBalance.map((r) => `${money(r.amount)} ${r.currency}`).join(" · ")}
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-4 text-sm">
        <Link href={withQuery("/admin/analytics/funnel")} className="btn-primary">
          Sales Funnel Report
        </Link>
        <Link href={withQuery("/admin/analytics/financial")} className="btn-primary">
          Financial Report
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Upcoming events (next 60 days)</h2>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-ink/60">No upcoming events in this window.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {upcomingEvents.map((b) => (
                <li key={b.id} className="flex justify-between border-b border-espresso-100 pb-2">
                  <Link href={`/admin/bookings/${b.id}`} className="text-espresso-600 hover:underline">
                    {b.bookingNumber} — {b.client.fullName}
                  </Link>
                  <span className="text-ink/60">{b.eventDate ? new Date(b.eventDate).toLocaleDateString() : "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Open planning requests, oldest first</h2>
          {planningAges.length === 0 ? (
            <p className="text-sm text-ink/60">No open planning requests.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {planningAges.slice(0, 15).map((r) => (
                <li key={r.id} className="flex justify-between border-b border-espresso-100 pb-2">
                  <span>{r.subject}</span>
                  <span className="text-ink/60">{r.ageDays}d old</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Recent activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-ink/60">No recent activity.</p>
        ) : (
          <ul className="space-y-1 text-sm text-ink/70">
            {recentActivity.map((e) => (
              <li key={e.id}>
                {e.createdAt.toLocaleString()} — {e.actorType} {e.action} ({e.entityType})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
