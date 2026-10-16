import { randomUUID } from "crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getInvoiceDetail } from "@/lib/invoices/data";
import { computePaymentSummary } from "@/lib/payments/totals";
import { getValidNextStatuses } from "@/lib/invoices/transitions";
import { prisma } from "@/lib/db";
import { getLatestEmailDelivery } from "@/lib/email/outbox";
import {
  updateInvoiceDetails,
  addInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
  updateInvoiceStatus,
} from "../actions";
import { SendInvoiceButton } from "./SendInvoiceButton";

export const metadata: Metadata = { title: "Invoice Detail — Moira Events Admin" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dateInputValue(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function AdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoiceDetail(id);
  if (!invoice) notFound();

  const { booking } = invoice;
  const { client, event } = booking;
  const isDraft = invoice.status === "DRAFT";
  const nextStatuses = getValidNextStatuses(invoice.status);
  const paymentSummary = computePaymentSummary(invoice.total, booking.payments);
  const hasMultipleInvoices = booking.invoices.length > 1;
  const requestId = randomUUID();
  const lastDelivery = await getLatestEmailDelivery("INVOICE_ISSUED", id);
  // Passive display only — never mutates Invoice.status (Stage N keeps the
  // existing admin-only status-transition philosophy unchanged).
  const lastOnlinePayment = await prisma.payment.findFirst({
    where: { invoiceId: id, provider: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true, amount: true, currency: true },
  });

  const bookingServices = isDraft
    ? await prisma.bookingService.findMany({ where: { bookingId: booking.id }, orderBy: { sortOrder: "asc" } })
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">{invoice.invoiceNumber}</p>
          <h1 className="font-serif text-2xl text-espresso-700">Invoice for {client.fullName}</h1>
          <p className="text-sm text-ink/60">
            Created {invoice.createdAt.toLocaleString()} ·{" "}
            <Link href={`/admin/bookings/${booking.id}`} className="text-espresso-600 hover:underline">
              View Booking {booking.bookingNumber}
            </Link>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-espresso-100 px-3 py-1.5 text-sm font-medium text-espresso-700">
              {invoice.status.replaceAll("_", " ")}
            </span>
            <a href={`/admin/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Download Invoice PDF
            </a>
            <SendInvoiceButton invoiceId={invoice.id} requestId={requestId} />
          </div>
          {lastDelivery && (
            <p className="text-xs text-ink/50">
              Last sent {lastDelivery.createdAt.toLocaleString()} to {lastDelivery.recipientEmail} —{" "}
              <span className={lastDelivery.status === "FAILED" ? "text-red-600" : "text-ink/60"}>
                {lastDelivery.status === "FAILED" ? `Failed: ${lastDelivery.lastError}` : lastDelivery.status}
              </span>
            </p>
          )}
          {lastOnlinePayment && (
            <p className="text-xs text-ink/50">
              Last online payment: {lastOnlinePayment.createdAt.toLocaleString()} — {money(lastOnlinePayment.amount)}{" "}
              {lastOnlinePayment.currency ?? ""} ({lastOnlinePayment.status.replaceAll("_", " ")})
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Client</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Name" value={client.fullName} />
            <Row label="Email" value={client.email} />
            <Row label="Phone" value={client.phone} />
          </dl>
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Event</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Event Type" value={event.type} />
            <Row label="Date" value={booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : undefined} />
            <Row label="Location" value={booking.location} />
          </dl>
        </section>
      </div>

      {/* Items */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Invoice Items</h2>

        {invoice.items.length === 0 ? (
          <p className="mb-4 text-sm text-ink/50">No items yet.</p>
        ) : (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-espresso-200 text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-2 pr-3">Description</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Unit Price</th>
                  <th className="py-2 pr-3">Line Total</th>
                  {isDraft && <th className="py-2"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-100">
                {invoice.items.map((item) =>
                  isDraft ? (
                    <tr key={item.id}>
                      <td colSpan={5} className="py-3">
                        <form
                          action={updateInvoiceItem.bind(null, item.id, invoice.id)}
                          className="flex flex-wrap items-end gap-2"
                        >
                          <input className="field-input w-56" name="description" defaultValue={item.description} required />
                          <input
                            className="field-input w-16"
                            name="quantity"
                            type="number"
                            min={1}
                            defaultValue={item.quantity ?? 1}
                          />
                          <input
                            className="field-input w-28"
                            name="unitPrice"
                            type="number"
                            min={0}
                            step="0.01"
                            defaultValue={item.unitPrice ? Number(item.unitPrice) : undefined}
                          />
                          <span className="w-28 text-sm text-ink/70">{money(item.lineTotal)}</span>
                          <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                            Save
                          </button>
                        </form>
                        <form action={deleteInvoiceItem.bind(null, item.id, invoice.id)} className="mt-1">
                          <button type="submit" className="text-xs text-red-600 hover:underline">
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id}>
                      <td className="py-2 pr-3">{item.description}</td>
                      <td className="py-2 pr-3">{item.quantity ?? 1}</td>
                      <td className="py-2 pr-3">{money(item.unitPrice)}</td>
                      <td className="py-2 pr-3">{money(item.lineTotal)}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

        {isDraft && (
          <div className="grid gap-6 sm:grid-cols-2">
            {bookingServices.length > 0 && (
              <form
                action={addInvoiceItem.bind(null, invoice.id)}
                className="space-y-2 rounded-lg border border-espresso-100 p-4"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Add Service</p>
                <select className="field-input" name="bookingServiceId" required defaultValue="">
                  <option value="" disabled>
                    Select an agreed service
                  </option>
                  {bookingServices.map((bs) => (
                    <option key={bs.id} value={bs.id}>
                      {bs.description}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn-secondary w-full">
                  + Add Service
                </button>
              </form>
            )}

            <form
              action={addInvoiceItem.bind(null, invoice.id)}
              className="space-y-2 rounded-lg border border-espresso-100 p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Add Custom Item</p>
              <input className="field-input" name="description" placeholder="Description" required />
              <div className="flex gap-2">
                <input className="field-input w-20" name="quantity" type="number" min={1} defaultValue={1} placeholder="Qty" />
                <input className="field-input" name="unitPrice" type="number" min={0} step="0.01" placeholder="Unit price" />
              </div>
              <button type="submit" className="btn-secondary w-full">
                + Add Custom Item
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Financial summary + dates/notes/terms */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Financial Summary &amp; Details</h2>

        {isDraft ? (
          <form action={updateInvoiceDetails.bind(null, invoice.id)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="field-label">Currency</label>
                <select className="field-input" name="currency" defaultValue={invoice.currency ?? ""}>
                  <option value="">Not set</option>
                  <option value="RWF">RWF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="field-label">Issue Date</label>
                <input className="field-input" type="date" name="issueDate" defaultValue={dateInputValue(invoice.issueDate)} />
              </div>
              <div>
                <label className="field-label">Due Date <span className="text-xs text-ink/40">(optional)</span></label>
                <input className="field-input" type="date" name="dueDate" defaultValue={dateInputValue(invoice.dueDate)} />
              </div>
            </div>

            <div className="rounded-lg bg-ivory-100 p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-ink/60">Subtotal</span>
                <span>{money(invoice.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <label htmlFor="discount" className="text-ink/60">Discount</label>
                <input
                  id="discount"
                  className="field-input w-32"
                  name="discount"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={invoice.discount ? Number(invoice.discount) : undefined}
                />
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <label htmlFor="tax" className="text-ink/60">
                  Tax <span className="text-xs">(manual only — not auto-calculated)</span>
                </label>
                <input
                  id="tax"
                  className="field-input w-32"
                  name="tax"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={invoice.tax ? Number(invoice.tax) : undefined}
                />
              </div>
              <div className="mt-3 flex justify-between border-t border-espresso-200 pt-3 text-base font-semibold text-espresso-700">
                <span>Total</span>
                <span>
                  {money(invoice.total)} {invoice.currency ?? ""}
                </span>
              </div>
            </div>

            <div>
              <label className="field-label">
                Client Notes <span className="text-xs text-ink/40">(visible to client on a future invoice page)</span>
              </label>
              <textarea className="field-input" name="clientNotes" rows={3} defaultValue={invoice.clientNotes ?? ""} />
            </div>
            <div>
              <label className="field-label">
                Internal Notes <span className="text-xs text-ink/40">(staff only — never shown to the client)</span>
              </label>
              <textarea className="field-input" name="internalNotes" rows={3} defaultValue={invoice.internalNotes ?? ""} />
            </div>
            <div>
              <label className="field-label">Terms</label>
              <textarea
                className="field-input"
                name="terms"
                rows={3}
                defaultValue={invoice.terms ?? ""}
                placeholder="Enter applicable terms and conditions..."
              />
            </div>

            <button type="submit" className="btn-primary">
              Save Details
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-sm">
            <dl className="space-y-1">
              <Row label="Currency" value={invoice.currency} />
              <Row label="Issue Date" value={invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : undefined} />
              <Row label="Due Date" value={invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : undefined} />
            </dl>
            <div className="rounded-lg bg-ivory-100 p-4">
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
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Client Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-ink/80">{invoice.clientNotes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Terms</p>
                <p className="mt-1 whitespace-pre-wrap text-ink/80">{invoice.terms}</p>
              </div>
            )}
            <p className="text-xs text-ink/40">
              This invoice has been issued — items, discount, tax, and notes can no longer be edited directly. Use
              status changes (e.g. Void) for corrections.
            </p>
          </div>
        )}
      </section>

      {/* Payment summary */}
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
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink/50">
            {paymentSummary.state.replaceAll("_", " ")}
          </p>
        </div>
        <p className="mt-3 text-xs text-ink/50">
          Payments are recorded at the booking level (Stage G), not allocated per invoice.
          {hasMultipleInvoices &&
            " This booking has more than one invoice — the figures above reflect all payments on the booking, not a per-invoice split."}
        </p>
      </section>

      {/* Status */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Status</h2>
        {nextStatuses.length === 0 ? (
          <p className="text-sm text-ink/50">This invoice is in a final state — no further status changes.</p>
        ) : (
          <form action={updateInvoiceStatus.bind(null, invoice.id)} className="space-y-3">
            <select name="status" defaultValue={nextStatuses[0]} className="field-input w-auto">
              {nextStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field-input" name="changedBy" placeholder="Changed by (optional)" />
              <input className="field-input" name="note" placeholder="Note (optional)" />
            </div>
            <button type="submit" className="btn-primary">
              Update Status
            </button>
          </form>
        )}
      </section>

      {/* Status history */}
      {invoice.statusHistory.length > 0 && (
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Status History</h2>
          <ul className="space-y-3 text-sm">
            {invoice.statusHistory.map((h) => (
              <li key={h.id} className="border-t border-espresso-100 pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-2 text-xs text-ink/50">
                  <span className="rounded-full bg-espresso-100 px-2 py-0.5 font-medium text-espresso-700">
                    {h.previousStatus ? h.previousStatus.replaceAll("_", " ") : "—"} → {h.newStatus.replaceAll("_", " ")}
                  </span>
                  <span>{h.changedBy ?? "—"}</span>
                  <span>{h.createdAt.toLocaleString()}</span>
                </div>
                {h.note && <p className="mt-1 text-ink/80">{h.note}</p>}
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
