import Link from "next/link";
import type { Metadata } from "next";
import { getBookingsList } from "@/lib/bookings/data";
import { BookingStatus } from "@/lib/generated/prisma/client";

export const metadata: Metadata = { title: "Bookings — Moira Events Admin" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";

  const bookings = await getBookingsList({ q, status });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-espresso-700">Bookings</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="q">Search</label>
          <input
            className="field-input w-64"
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Booking number, name, or email"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select className="field-input w-auto" id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            {Object.values(BookingStatus).map((s) => (
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
          <Link href="/admin/bookings" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {bookings.length === 0 ? (
        <p className="text-sm text-ink/60">No bookings match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Booking #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Event Date</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Agreed Amount</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/bookings/${booking.id}`} className="font-medium text-espresso-600 hover:underline">
                      {booking.bookingNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{booking.client.fullName}</td>
                  <td className="px-4 py-3">
                    {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">{booking.location ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                      {booking.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {money(booking.agreedTotal)} {booking.currency ?? ""}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{booking.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
