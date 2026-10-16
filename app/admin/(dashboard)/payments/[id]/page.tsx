import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPaymentDetail } from "@/lib/payments/data";
import { PaymentStatus } from "@/lib/generated/prisma/client";
import { updatePaymentStatus } from "../actions";

export const metadata: Metadata = { title: "Payment Detail — Moira Events Admin" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dateStr(d: Date | null | undefined) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export default async function AdminPaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getPaymentDetail(id);
  if (!payment) notFound();

  const { booking } = payment;
  const { client, event } = booking;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">{payment.reference || `Payment ${payment.id.slice(0, 8)}`}</p>
          <h1 className="font-serif text-2xl text-espresso-700">
            {money(payment.amount)} {payment.currency ?? ""}
          </h1>
          <p className="text-sm text-ink/60">Created {payment.createdAt.toLocaleString()}</p>
        </div>
        <span className="rounded-full bg-espresso-100 px-3 py-1.5 text-sm font-medium text-espresso-700">
          {payment.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Payment</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Amount" value={`${money(payment.amount)} ${payment.currency ?? ""}`} />
            <Row label="Type" value={payment.type} />
            <Row label="Method" value={payment.method} />
            <Row label="Reference" value={payment.reference} />
            <Row label="Payment Date" value={dateStr(payment.paymentDate)} />
            {payment.notes && <Row label="Notes" value={payment.notes} />}
          </dl>
          {(payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED") && (
            <div className="mt-4 border-t border-espresso-100 pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50">Refund</p>
              <dl className="space-y-1 text-sm">
                <Row label="Refund Amount" value={payment.refundAmount ? money(payment.refundAmount) : undefined} />
                <Row label="Refund Date" value={dateStr(payment.refundDate)} />
                <Row label="Refund Reference" value={payment.refundReference} />
                <Row label="Refund Reason" value={payment.refundReason} />
              </dl>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Booking</h2>
          <dl className="space-y-1 text-sm">
            <Row
              label="Booking"
              value={
                <Link href={`/admin/bookings/${booking.id}`} className="text-espresso-600 hover:underline">
                  {booking.bookingNumber}
                </Link>
              }
            />
            <Row label="Event Type" value={event.type} />
            <Row label="Event Date" value={booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : undefined} />
            <Row label="Location" value={booking.location} />
          </dl>
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Client</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Name" value={client.fullName} />
            <Row label="Email" value={client.email} />
            <Row label="Phone" value={client.phone} />
          </dl>
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Audit</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Created By" value={payment.createdBy} />
            <Row label="Created At" value={payment.createdAt.toLocaleString()} />
            <Row label="Updated By" value={payment.updatedBy} />
            <Row label="Updated At" value={payment.updatedAt.toLocaleString()} />
          </dl>
        </section>
      </div>

      {/* Status */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Status</h2>
        <form action={updatePaymentStatus.bind(null, payment.id)} className="space-y-3">
          <select name="status" defaultValue={payment.status} className="field-input w-auto">
            {Object.values(PaymentStatus).map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field-input" name="changedBy" placeholder="Changed by (optional)" />
            <input className="field-input" name="note" placeholder="Note (optional)" />
          </div>
          <div className="rounded-lg border border-espresso-100 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50">
              Only used if setting status to Refunded / Partially Refunded
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field-input" name="refundAmount" type="number" min={0} step="0.01" placeholder="Refund amount" />
              <input className="field-input" name="refundDate" type="date" />
              <input className="field-input" name="refundReference" placeholder="Refund reference" />
              <input className="field-input" name="refundReason" placeholder="Refund reason" />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Update Status
          </button>
        </form>
      </section>

      {/* Status history */}
      {payment.statusHistory.length > 0 && (
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Status History</h2>
          <ul className="space-y-3 text-sm">
            {payment.statusHistory.map((h) => (
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

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/50">{label}</dt>
      <dd className="text-right text-ink/80">{value || "—"}</dd>
    </div>
  );
}
