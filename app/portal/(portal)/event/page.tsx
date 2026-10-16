import type { Metadata } from "next";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import {
  getPrimaryBookingForClient,
  getClientVisibleTimelineForBooking,
  getClientVisibleTasksForBooking,
  getClientVisibleVendorsForBooking,
  getClientVisiblePlanningNotesForBooking,
} from "@/lib/client-portal/data";

export const metadata: Metadata = { title: "My Event — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PortalEventPage() {
  const clientId = await requireAuthenticatedClientId();
  const booking = await getPrimaryBookingForClient(clientId);

  if (!booking) {
    return (
      <div className="rounded-xl border border-espresso-100 bg-ivory-50 p-8 text-center">
        <p className="text-sm text-ink/60">No event on file yet.</p>
      </div>
    );
  }

  const [timelineItems, tasks, vendors, notes] = await Promise.all([
    getClientVisibleTimelineForBooking(clientId, booking.id),
    getClientVisibleTasksForBooking(clientId, booking.id),
    getClientVisibleVendorsForBooking(clientId, booking.id),
    getClientVisiblePlanningNotesForBooking(clientId, booking.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">{booking.bookingNumber}</p>
          <h1 className="font-serif text-2xl text-espresso-700">My Event</h1>
        </div>
        <a href="/portal/event/pdf" target="_blank" rel="noopener noreferrer" className="btn-secondary">
          Download Booking Confirmation
        </a>
      </div>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Event Details</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Row label="Event Type" value={booking.event?.type} />
          <Row label="Wedding Type" value={booking.weddingType?.name} />
          <Row label="Date" value={booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : undefined} />
          <Row label="Location" value={booking.location} />
          <Row label="Guests" value={booking.estimatedGuests?.toString()} />
          <Row label="Status" value={booking.status.replaceAll("_", " ")} />
        </dl>
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Agreed Services</h2>
        <p className="mb-4 text-xs text-ink/40">
          These are the services as agreed at booking time — they won&apos;t change even if Moira Events updates its
          general service catalogue later.
        </p>
        {booking.services.length === 0 ? (
          <p className="text-sm text-ink/50">No services on file yet.</p>
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
                {booking.services.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 pr-3">{s.description}</td>
                    <td className="py-2 pr-3">
                      {s.quantity ?? 1} {s.unit ?? ""}
                    </td>
                    <td className="py-2 pr-3">{money(s.unitPrice)}</td>
                    <td className="py-2 pr-3">{money(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex justify-between border-t border-espresso-200 pt-3 text-base font-semibold text-espresso-700">
          <span>Agreed Total</span>
          <span>
            {money(booking.agreedTotal)} {booking.currency ?? ""}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Timeline</h2>
        {timelineItems.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing here yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {timelineItems.map((item) => (
              <li key={item.id} className="border-t border-espresso-100 pt-3 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">
                    {item.title} {item.type && <span className="text-xs text-ink/40">· {item.type}</span>}
                  </p>
                  <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                    {item.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-ink/50">{item.date ? new Date(item.date).toLocaleString() : "No date set"}</p>
                {item.description && <p className="mt-1 text-ink/70">{item.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing here yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {tasks.map((task) => (
              <li key={task.id} className="border-t border-espresso-100 pt-3 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">{task.title}</p>
                  <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                    {task.status.replaceAll("_", " ")}
                  </span>
                </div>
                {task.dueDate && <p className="text-xs text-ink/50">Due {new Date(task.dueDate).toLocaleDateString()}</p>}
                {task.description && <p className="mt-1 text-ink/70">{task.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Recommended Vendors</h2>
        <p className="mb-4 text-xs text-ink/40">
          Moira Events recommends these vendors — you&apos;re welcome to reach out and decide for yourself.
        </p>
        {vendors.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing here yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {vendors.map((bv) => (
              <li key={bv.id} className="border-t border-espresso-100 pt-3 first:border-t-0 first:pt-0">
                <p className="font-medium text-ink">
                  {bv.vendorRecommendation.name}{" "}
                  {bv.vendorRecommendation.category && <span className="text-xs text-ink/40">· {bv.vendorRecommendation.category}</span>}
                </p>
                {bv.vendorRecommendation.description && <p className="mt-1 text-ink/70">{bv.vendorRecommendation.description}</p>}
                {bv.serviceDescription && <p className="mt-1 text-ink/70">{bv.serviceDescription}</p>}
                {(bv.vendorRecommendation.contactName || bv.vendorRecommendation.email || bv.vendorRecommendation.phone || bv.vendorRecommendation.website) && (
                  <p className="mt-1 text-xs text-ink/50">
                    {[bv.vendorRecommendation.contactName, bv.vendorRecommendation.email, bv.vendorRecommendation.phone, bv.vendorRecommendation.website]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Planning Notes</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing here yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {notes.map((note) => (
              <li key={note.id} className="border-t border-espresso-100 pt-3 first:border-t-0 first:pt-0">
                <p className="text-xs text-ink/50">{note.createdAt.toLocaleString()}</p>
                <p className="mt-1 whitespace-pre-wrap text-ink/80">{note.content}</p>
              </li>
            ))}
          </ul>
        )}
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
