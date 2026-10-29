import Link from "next/link";
import type { Metadata } from "next";
import { getQuotesList } from "@/lib/quotes/data";
import { QuoteStatus } from "@/lib/generated/prisma/client";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Quotes — Moira Events Admin" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdminRole("ADMIN");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";

  const quotes = await getQuotesList({ q, status });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-espresso-700">Quotes</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="q">Search</label>
          <input
            className="field-input w-64"
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Quote number, name, or email"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select className="field-input w-auto" id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            {Object.values(QuoteStatus).map((s) => (
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
          <Link href="/admin/quotes" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {quotes.length === 0 ? (
        <p className="text-sm text-ink/60">No quotes match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Quote #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Event Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/quotes/${quote.id}`} className="font-medium text-espresso-600 hover:underline">
                      {quote.quoteNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{quote.enquiry.client.fullName}</td>
                  <td className="px-4 py-3">
                    {quote.enquiry.event.eventDate ? new Date(quote.enquiry.event.eventDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {money(quote.totalAmount)} {quote.currency ?? ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                      {quote.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{quote.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {quote.expiresAt ? quote.expiresAt.toLocaleDateString() : "—"}
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
