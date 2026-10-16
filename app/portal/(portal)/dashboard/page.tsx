import Link from "next/link";
import type { Metadata } from "next";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getPrimaryBookingForClient, getPaymentsForBooking, getInvoicesForBooking } from "@/lib/client-portal/data";
import { computePaymentSummary } from "@/lib/payments/totals";

export const metadata: Metadata = { title: "Dashboard — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PortalDashboardPage() {
  const clientId = await requireAuthenticatedClientId();
  const booking = await getPrimaryBookingForClient(clientId);

  if (!booking) {
    return (
      <div className="rounded-xl border border-espresso-100 bg-ivory-50 p-8 text-center">
        <h1 className="mb-2 font-serif text-2xl text-espresso-700">Welcome</h1>
        <p className="text-sm text-ink/60">
          You don&apos;t have an event on file yet. Once Moira Events confirms your booking, it will appear here.
        </p>
      </div>
    );
  }

  const [payments, invoices] = await Promise.all([
    getPaymentsForBooking(clientId, booking.id),
    getInvoicesForBooking(clientId, booking.id),
  ]);
  const paymentSummary = computePaymentSummary(booking.agreedTotal, payments);
  const invoiceTotal = invoices.reduce((sum, inv) => sum + (inv.total ? Number(inv.total) : 0), 0);

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl text-espresso-700">Welcome back</h1>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Your Event</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Row label="Event Type" value={booking.event?.type} />
          <Row label="Wedding Type" value={booking.weddingType?.name} />
          <Row label="Date" value={booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : undefined} />
          <Row label="Location" value={booking.location} />
          <Row label="Guests" value={booking.estimatedGuests?.toString()} />
          <Row label="Booking Number" value={booking.bookingNumber} />
          <Row label="Status" value={booking.status.replaceAll("_", " ")} />
        </dl>
        <Link href="/portal/event" className="mt-4 inline-block text-sm text-espresso-600 hover:underline">
          View full event details →
        </Link>
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Financial Overview</h2>
        <div className="rounded-lg bg-ivory-100 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Agreed Amount</span>
            <span>
              {money(booking.agreedTotal)} {booking.currency ?? ""}
            </span>
          </div>
          {invoices.length > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-ink/60">Invoice Total</span>
              <span>
                {money(invoiceTotal)} {booking.currency ?? ""}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Total Paid</span>
            <span>
              {money(paymentSummary.totalPaid)} {booking.currency ?? ""}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-espresso-200 pt-2 text-base font-semibold text-espresso-700">
            <span>Outstanding Balance</span>
            <span>
              {money(paymentSummary.outstandingBalance)} {booking.currency ?? ""}
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link href="/portal/invoices" className="text-espresso-600 hover:underline">
            View Invoices →
          </Link>
          <Link href="/portal/payments" className="text-espresso-600 hover:underline">
            View Payments →
          </Link>
        </div>
      </section>
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
