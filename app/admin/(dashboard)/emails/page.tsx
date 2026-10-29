import Link from "next/link";
import type { Metadata } from "next";
import { getEmailDeliveriesList } from "@/lib/email/outbox";
import { EmailType, EmailDeliveryStatus } from "@/lib/generated/prisma/client";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Emails — Moira Events Admin" };
export const dynamic = "force-dynamic";

// Every EmailDelivery row ever written, independent of which business
// record it relates to — the per-record pages (quote/booking/invoice/
// planning-request detail) each already show only their own latest attempt
// via getLatestEmailDelivery; this view is the system-wide, full-history
// counterpart, including retry counts and provider message ids that
// otherwise exist only in the database.
export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; q?: string; from?: string; to?: string }>;
}) {
  await requireAdminRole("ADMIN");
  const params = await searchParams;
  const type = params.type ?? "";
  const status = params.status ?? "";
  const q = params.q?.trim() ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";

  const deliveries = await getEmailDeliveriesList({ type, status, q, from, to });
  const hasFilters = type || status || q || from || to;

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl text-espresso-700">Emails</h1>
      <p className="mb-6 text-sm text-ink/60">
        Every tracked email send attempt, across every record — retry counts, failures, and provider message ids
        included. Each business record&rsquo;s own detail page only shows its single latest attempt; this is the full
        history.
      </p>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="type">Type</label>
          <select className="field-input w-auto" id="type" name="type" defaultValue={type}>
            <option value="">All</option>
            {Object.values(EmailType).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select className="field-input w-auto" id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            {Object.values(EmailDeliveryStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="q">Recipient / Record Id</label>
          <input className="field-input w-56" id="q" name="q" type="text" defaultValue={q} />
        </div>
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
        {hasFilters && (
          <Link href="/admin/emails" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {deliveries.length === 0 ? (
        <p className="text-sm text-ink/60">No email deliveries match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Related Record</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3 text-ink/60">{d.createdAt.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/70">{d.type}</td>
                  <td className="px-4 py-3 text-ink/70">{d.recipientEmail}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {d.relatedRecordType ? `${d.relatedRecordType} · ${d.relatedRecordId}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        d.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-espresso-100 text-espresso-700"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{d.attemptCount}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {d.status === "FAILED" ? d.lastError : d.providerMessageId ? `msg: ${d.providerMessageId}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
