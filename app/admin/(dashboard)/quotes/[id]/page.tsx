import { randomUUID } from "crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getQuoteDetail } from "@/lib/quotes/data";
import { getServiceOptions } from "@/lib/enquiries/data";
import { QuoteStatus } from "@/lib/generated/prisma/client";
import { getLatestEmailDelivery } from "@/lib/email/outbox";
import {
  updateQuoteDetails,
  addQuoteItem,
  updateQuoteItem,
  deleteQuoteItem,
  updateQuoteStatus,
} from "../actions";
import { createBookingFromQuote } from "../../bookings/actions";
import { SendQuoteButton } from "./SendQuoteButton";

export const metadata: Metadata = { title: "Quote Detail — Moira Events Admin" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dateInputValue(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function AdminQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteDetail(id);
  if (!quote) notFound();

  const { enquiry } = quote;
  const { client, event } = enquiry;
  const requestId = randomUUID();
  const lastDelivery = await getLatestEmailDelivery("QUOTE_ISSUED", id);

  const catalogueServices =
    event.type === "WEDDING" || event.type === "PARTY" || event.type === "CORPORATE"
      ? await getServiceOptions(event.type)
      : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">
            {quote.quoteNumber} · v{quote.version}
          </p>
          <h1 className="font-serif text-2xl text-espresso-700">Quote for {client.fullName}</h1>
          <p className="text-sm text-ink/60">
            Created {quote.createdAt.toLocaleString()} ·{" "}
            <Link href={`/admin/enquiries/${enquiry.id}`} className="text-espresso-600 hover:underline">
              View Enquiry {enquiry.referenceNumber}
            </Link>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-espresso-100 px-3 py-1.5 text-sm font-medium text-espresso-700">
              {quote.status.replaceAll("_", " ")}
            </span>
            <a href={`/admin/quotes/${quote.id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Download Quote PDF
            </a>
            <SendQuoteButton quoteId={quote.id} requestId={requestId} />
          </div>
          {lastDelivery && (
            <p className="text-xs text-ink/50">
              Last sent {lastDelivery.createdAt.toLocaleString()} to {lastDelivery.recipientEmail} —{" "}
              <span className={lastDelivery.status === "FAILED" ? "text-red-600" : "text-ink/60"}>
                {lastDelivery.status === "FAILED" ? `Failed: ${lastDelivery.lastError}` : lastDelivery.status}
              </span>
            </p>
          )}
        </div>
      </div>

      {quote.status === "ACCEPTED" && (
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Booking</h2>
          {quote.booking ? (
            <Link href={`/admin/bookings/${quote.booking.id}`} className="btn-primary inline-flex">
              View Booking {quote.booking.bookingNumber}
            </Link>
          ) : (
            <form action={createBookingFromQuote.bind(null, quote.id)}>
              <button type="submit" className="btn-primary">
                Create Booking
              </button>
            </form>
          )}
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Client</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Name" value={client.fullName} />
            <Row label="Email" value={client.email} />
            <Row label="Phone" value={client.phone} />
            <Row label="WhatsApp" value={client.whatsapp} />
          </dl>
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Event</h2>
          <dl className="space-y-1 text-sm">
            {event.weddingType && <Row label="Wedding Type" value={event.weddingType.name} />}
            {event.eventSubtype && <Row label="Event Type" value={event.eventSubtype} />}
            <Row label="Date" value={event.eventDate?.toLocaleDateString()} />
            <Row label="Location" value={event.location} />
            <Row label="Guests" value={event.estimatedGuests?.toString()} />
          </dl>
        </section>
      </div>

      {/* Services / line items */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Services</h2>

        {quote.items.length === 0 ? (
          <p className="mb-4 text-sm text-ink/50">No items yet.</p>
        ) : (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-espresso-200 text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-2 pr-3">Description</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Unit</th>
                  <th className="py-2 pr-3">Unit Price</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Notes</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-100">
                {quote.items.map((item) => (
                  <tr key={item.id}>
                    <td colSpan={7} className="py-3">
                      <form
                        action={updateQuoteItem.bind(null, item.id, quote.id)}
                        className="flex flex-wrap items-end gap-2"
                      >
                        <input
                          className="field-input w-48"
                          name="description"
                          defaultValue={item.description}
                          required
                        />
                        <input
                          className="field-input w-16"
                          name="quantity"
                          type="number"
                          min={1}
                          defaultValue={item.quantity ?? 1}
                        />
                        <input className="field-input w-28" name="unit" defaultValue={item.unit ?? ""} placeholder="unit" />
                        <input
                          className="field-input w-28"
                          name="unitPrice"
                          type="number"
                          min={0}
                          step="0.01"
                          defaultValue={item.unitPrice ? Number(item.unitPrice) : undefined}
                        />
                        <span className="w-24 text-sm text-ink/70">{money(item.total)}</span>
                        <input
                          className="field-input w-40"
                          name="notes"
                          defaultValue={item.notes ?? ""}
                          placeholder="internal note"
                        />
                        <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                          Save
                        </button>
                      </form>
                      <form action={deleteQuoteItem.bind(null, item.id, quote.id)} className="mt-1">
                        <button type="submit" className="text-xs text-red-600 hover:underline">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {catalogueServices.length > 0 && (
            <form action={addQuoteItem.bind(null, quote.id)} className="space-y-2 rounded-lg border border-espresso-100 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Add Service</p>
              <select className="field-input" name="serviceId" required defaultValue="">
                <option value="" disabled>
                  Select a service
                </option>
                {catalogueServices.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input className="field-input w-20" name="quantity" type="number" min={1} defaultValue={1} placeholder="Qty" />
                <input className="field-input" name="unitPrice" type="number" min={0} step="0.01" placeholder="Unit price" />
              </div>
              <button type="submit" className="btn-secondary w-full">
                + Add Service
              </button>
            </form>
          )}

          <form action={addQuoteItem.bind(null, quote.id)} className="space-y-2 rounded-lg border border-espresso-100 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Add Custom Item</p>
            <input className="field-input" name="description" placeholder="Description" required />
            <div className="flex gap-2">
              <input className="field-input w-20" name="quantity" type="number" min={1} defaultValue={1} placeholder="Qty" />
              <input className="field-input w-24" name="unit" placeholder="Unit" />
              <input className="field-input" name="unitPrice" type="number" min={0} step="0.01" placeholder="Unit price" />
            </div>
            <button type="submit" className="btn-secondary w-full">
              + Add Custom Item
            </button>
          </form>
        </div>
      </section>

      {/* Financial summary + dates/notes/terms */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Financial Summary &amp; Details</h2>
        <form action={updateQuoteDetails.bind(null, quote.id)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label">Currency</label>
              <select className="field-input" name="currency" defaultValue={quote.currency ?? ""}>
                <option value="">Not set</option>
                <option value="RWF">RWF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="field-label">Issue Date</label>
              <input className="field-input" type="date" name="issueDate" defaultValue={dateInputValue(quote.issueDate)} />
            </div>
            <div>
              <label className="field-label">Expiry Date</label>
              <input className="field-input" type="date" name="expiresAt" defaultValue={dateInputValue(quote.expiresAt)} />
            </div>
          </div>

          <div className="rounded-lg bg-ivory-100 p-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-ink/60">Subtotal</span>
              <span>{money(quote.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-1">
              <label htmlFor="discountAmount" className="text-ink/60">Discount</label>
              <input
                id="discountAmount"
                className="field-input w-32"
                name="discountAmount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={quote.discountAmount ? Number(quote.discountAmount) : undefined}
              />
            </div>
            <input className="field-input mt-1" name="discountNote" placeholder="Discount note (optional)" defaultValue={quote.discountNote ?? ""} />
            <div className="mt-2 flex items-center justify-between gap-3 py-1">
              <label htmlFor="taxAmount" className="text-ink/60">
                Tax <span className="text-xs">(manual only — not auto-calculated)</span>
              </label>
              <input
                id="taxAmount"
                className="field-input w-32"
                name="taxAmount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={quote.taxAmount ? Number(quote.taxAmount) : undefined}
              />
            </div>
            <input className="field-input mt-1" name="taxNote" placeholder="Tax note (optional)" defaultValue={quote.taxNote ?? ""} />
            <div className="mt-3 flex justify-between border-t border-espresso-200 pt-3 text-base font-semibold text-espresso-700">
              <span>Grand Total</span>
              <span>
                {money(quote.totalAmount)} {quote.currency ?? ""}
              </span>
            </div>
          </div>

          <div>
            <label className="field-label">Client Notes <span className="text-xs text-ink/40">(visible to client on a future quote page)</span></label>
            <textarea className="field-input" name="clientNotes" rows={3} defaultValue={quote.clientNotes ?? ""} />
          </div>
          <div>
            <label className="field-label">Internal Notes <span className="text-xs text-ink/40">(staff only — never shown to the client)</span></label>
            <textarea className="field-input" name="internalNotes" rows={3} defaultValue={quote.internalNotes ?? ""} />
          </div>
          <div>
            <label className="field-label">Terms</label>
            <textarea className="field-input" name="terms" rows={3} defaultValue={quote.terms ?? ""} placeholder="Enter applicable terms and conditions..." />
          </div>

          <button type="submit" className="btn-primary">
            Save Details
          </button>
        </form>
      </section>

      {/* Status */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Status</h2>
        <form action={updateQuoteStatus.bind(null, quote.id)} className="space-y-3">
          <select name="status" defaultValue={quote.status} className="field-input w-auto">
            {Object.values(QuoteStatus).map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="field-input" name="actedBy" placeholder="Accepted/declined by (if applicable)" />
            <input className="field-input" name="declineReason" placeholder="Decline reason (if applicable)" />
            <input className="field-input" name="revisionRequestNote" placeholder="Revision request note (if applicable)" />
          </div>
          <button type="submit" className="btn-primary">
            Update Status
          </button>
          <p className="text-xs text-ink/50">
            This only updates the quote&rsquo;s status — it does not send an email. Relay the update to the client
            directly (WhatsApp/phone/email).
          </p>
        </form>
      </section>

      {/* Revision history */}
      {quote.revisions.length > 0 && (
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Revision History</h2>
          <ul className="space-y-3 text-sm">
            {quote.revisions.map((rev) => (
              <li key={rev.id} className="border-t border-espresso-100 pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-2 text-xs text-ink/50">
                  <span className="rounded-full bg-espresso-100 px-2 py-0.5 font-medium text-espresso-700">
                    v{rev.versionNumber}
                  </span>
                  <span>{rev.changedBy ?? "—"}</span>
                  <span>{rev.createdAt.toLocaleString()}</span>
                </div>
                {rev.requestedNote && <p className="mt-1 text-ink/80">{rev.requestedNote}</p>}
              </li>
            ))}
          </ul>
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
