import type { Metadata } from "next";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getPrimaryBookingForClient, getQuoteForClientBooking } from "@/lib/client-portal/data";

export const metadata: Metadata = { title: "My Quote — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PortalQuotePage() {
  const clientId = await requireAuthenticatedClientId();
  const booking = await getPrimaryBookingForClient(clientId);
  const quote = booking ? await getQuoteForClientBooking(clientId, booking.id) : null;

  if (!quote) {
    return (
      <div className="rounded-xl border border-espresso-100 bg-ivory-50 p-8 text-center">
        <p className="text-sm text-ink/60">No accepted quote is available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">{quote.quoteNumber}</p>
          <h1 className="font-serif text-2xl text-espresso-700">My Quote</h1>
          <p className="text-sm text-ink/60">
            Version {quote.version} · {quote.status.replaceAll("_", " ")}
          </p>
        </div>
        <a href="/portal/quote/pdf" target="_blank" rel="noopener noreferrer" className="btn-secondary">
          Download PDF
        </a>
      </div>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Row label="Issue Date" value={quote.issueDate ? new Date(quote.issueDate).toLocaleDateString() : undefined} />
          <Row label="Expires" value={quote.expiresAt ? new Date(quote.expiresAt).toLocaleDateString() : undefined} />
        </dl>
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Services</h2>
        {quote.items.length === 0 ? (
          <p className="text-sm text-ink/50">No items on file.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-espresso-200 text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-2 pr-3">Description</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Unit Price</th>
                  <th className="py-2 pr-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-100">
                {quote.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-3">{item.description}</td>
                    <td className="py-2 pr-3">
                      {item.quantity ?? 1} {item.unit ?? ""}
                    </td>
                    <td className="py-2 pr-3">{money(item.unitPrice)}</td>
                    <td className="py-2 pr-3">{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-ivory-100 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Subtotal</span>
            <span>{money(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Discount</span>
            <span>{money(quote.discountAmount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Tax</span>
            <span>{money(quote.taxAmount)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-espresso-200 pt-2 text-base font-semibold text-espresso-700">
            <span>Total</span>
            <span>
              {money(quote.totalAmount)} {quote.currency ?? ""}
            </span>
          </div>
        </div>
      </section>

      {(quote.clientNotes || quote.terms) && (
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          {quote.clientNotes && (
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{quote.clientNotes}</p>
            </div>
          )}
          {quote.terms && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Terms</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{quote.terms}</p>
            </div>
          )}
        </section>
      )}
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
