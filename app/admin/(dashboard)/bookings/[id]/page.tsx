import { randomUUID } from "crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getBookingDetail, findOtherBookingsOnSameDate } from "@/lib/bookings/data";
import { getLatestEmailDelivery } from "@/lib/email/outbox";
import { SendConfirmationButton } from "./SendConfirmationButton";
import { getValidNextStatuses } from "@/lib/bookings/transitions";
import { getValidNextStatuses as getValidTimelineStatuses } from "@/lib/timeline/transitions";
import { getValidNextStatuses as getValidTaskStatuses } from "@/lib/tasks/transitions";
import {
  updateBookingStatus,
  updateBookingPlanningNotes,
  createTimelineItem,
  updateTimelineItem,
  updateTimelineItemStatus,
  deleteTimelineItem,
  linkVendorToBooking,
  updateBookingVendor,
  unlinkVendorFromBooking,
  addPlanningNote,
  deletePlanningNote,
} from "../actions";
import { createTask, updateTask, updateTaskStatus, deleteTask } from "../../tasks/actions";
import { computePaymentSummary } from "@/lib/payments/totals";
import { PaymentStatus } from "@/lib/generated/prisma/client";
import { recordPayment } from "../../payments/actions";
import { createInvoiceFromBooking } from "../../invoices/actions";
import { generateClientPortalInvite } from "../../clients/actions";

const TIMELINE_TYPE_SUGGESTIONS = ["Planning", "Meeting", "Vendor", "Venue", "Rehearsal", "Event Day", "Other"];

export const metadata: Metadata = { title: "Booking Detail — Moira Events Admin" };
export const dynamic = "force-dynamic";

function money(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dateInputValue(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function timeInputValue(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(11, 16);
}

export default async function AdminBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { id } = await params;
  const { invite: oneTimeInviteToken } = await searchParams;
  const booking = await getBookingDetail(id);
  if (!booking) notFound();

  const [otherBookingsSameDate, nextStatuses, availableVendors] = await Promise.all([
    findOtherBookingsOnSameDate(booking.id, booking.eventDate),
    Promise.resolve(getValidNextStatuses(booking.status)),
    prisma.vendorRecommendation.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const { client, event, quote, weddingType } = booking;
  const paymentSummary = computePaymentSummary(booking.agreedTotal, booking.payments);
  const recommendedVendorIds = new Set(booking.vendorRecommendations.map((bv) => bv.vendorRecommendationId));
  const unrecommendedVendors = availableVendors.filter((v) => !recommendedVendorIds.has(v.id));
  const requestId = randomUUID();
  const lastDelivery = await getLatestEmailDelivery("BOOKING_CONFIRMATION", id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">{booking.bookingNumber}</p>
          <h1 className="font-serif text-2xl text-espresso-700">Booking for {client.fullName}</h1>
          <p className="text-sm text-ink/60">
            {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : "No date set"}
            {booking.location ? ` · ${booking.location}` : ""} · Created {booking.createdAt.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-espresso-100 px-3 py-1.5 text-sm font-medium text-espresso-700">
              {booking.status.replaceAll("_", " ")}
            </span>
            <a href={`/admin/bookings/${booking.id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Download Booking Confirmation
            </a>
            <SendConfirmationButton bookingId={booking.id} requestId={requestId} />
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

      <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-espresso-600">
        <a href="#portal-access" className="hover:underline">Portal Access</a>
        <a href="#timeline" className="hover:underline">Timeline</a>
        <a href="#tasks" className="hover:underline">Tasks</a>
        <a href="#vendors" className="hover:underline">Vendors</a>
        <a href="#planning-notes" className="hover:underline">Planning Notes</a>
        <a href="#planning-requests" className="hover:underline">Planning Requests</a>
        <a href="#invoices" className="hover:underline">Invoices</a>
        <a href="#payments" className="hover:underline">Payments</a>
        <a href="#status" className="hover:underline">Status</a>
      </nav>

      {otherBookingsSameDate.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">⚠ Another active booking shares this event date:</p>
          <ul className="mt-1 list-inside list-disc">
            {otherBookingsSameDate.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/bookings/${b.id}`} className="underline">
                  {b.bookingNumber} — {b.client.fullName}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs">This is informational only — Moira Events may run multiple events on one date.</p>
        </div>
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
            <Row label="Event Type" value={event.type} />
            {weddingType && <Row label="Wedding Type" value={weddingType.name} />}
            <Row label="Date" value={booking.eventDate?.toLocaleDateString()} />
            <Row label="Location" value={booking.location} />
            <Row label="Guests" value={booking.estimatedGuests?.toString()} />
          </dl>
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6 md:col-span-2">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Commercial Agreement</h2>
          {quote && (
            <p className="mb-3 text-sm text-ink/60">
              <Link href={`/admin/quotes/${quote.id}`} className="text-espresso-600 hover:underline">
                {quote.quoteNumber}
              </Link>{" "}
              · accepted at version {booking.acceptedQuoteVersion}
            </p>
          )}

          {booking.services.length === 0 ? (
            <p className="text-sm text-ink/50">No agreed services recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-espresso-200 text-xs uppercase tracking-wide text-ink/50">
                  <tr>
                    <th className="py-2 pr-3">Description</th>
                    <th className="py-2 pr-3">Qty</th>
                    <th className="py-2 pr-3">Unit</th>
                    <th className="py-2 pr-3">Unit Price</th>
                    <th className="py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso-100">
                  {booking.services.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-3">{s.description}</td>
                      <td className="py-2 pr-3">{s.quantity ?? 1}</td>
                      <td className="py-2 pr-3">{s.unit ?? "—"}</td>
                      <td className="py-2 pr-3">{money(s.unitPrice)}</td>
                      <td className="py-2">{money(s.total)}</td>
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
      </div>

      {/* Portal Access */}
      <section id="portal-access" className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Client Portal Access</h2>
        <p className="mb-3 text-sm text-ink/70">
          {client.passwordHash ? (
            <>
              Portal account active
              {!client.emailVerifiedAt && " (email not yet verified)"}
              {client.lastLoginAt ? ` · last signed in ${client.lastLoginAt.toLocaleString()}` : " · never signed in"}
              .
            </>
          ) : (
            "No portal account yet — the client cannot sign in until they activate one."
          )}
        </p>

        {oneTimeInviteToken && (
          <div className="mb-3 rounded-lg bg-ivory-100 p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Invite Link</p>
            <p className="mt-1 break-all">
              <Link href={`/portal/activate?token=${oneTimeInviteToken}`} className="text-espresso-600 hover:underline">
                /portal/activate?token={oneTimeInviteToken}
              </Link>
            </p>
            <p className="mt-1 text-xs font-medium text-amber-700">
              Copy this link now — for security it is shown only once and cannot be retrieved again after you leave
              this page. Send it to the client manually (email, WhatsApp, call); no email is sent automatically.
            </p>
          </div>
        )}

        <form action={generateClientPortalInvite.bind(null, client.id, booking.id)}>
          <button type="submit" className="btn-secondary">
            {client.passwordHash ? "Generate New Invite / Reset Link" : "Generate Invite Link"}
          </button>
        </form>
      </section>

      {/* Timeline */}
      <section id="timeline" className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Timeline</h2>

        {booking.timelineItems.length === 0 ? (
          <p className="mb-4 text-sm text-ink/50">No timeline items yet.</p>
        ) : (
          <ul className="mb-6 space-y-3">
            {booking.timelineItems.map((item) => {
              const timelineNextStatuses = getValidTimelineStatuses(item.status);
              return (
                <li key={item.id} className="rounded-lg border border-espresso-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">
                        {item.title} {item.type && <span className="text-xs text-ink/40">· {item.type}</span>}
                      </p>
                      <p className="text-xs text-ink/50">
                        {item.date ? new Date(item.date).toLocaleString() : "No date set"}
                        {item.clientVisible && <span className="ml-2 text-espresso-600">· Client-visible</span>}
                      </p>
                      {item.description && <p className="mt-1 text-sm text-ink/70">{item.description}</p>}
                    </div>
                    <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-espresso-600">Edit</summary>
                    <form action={updateTimelineItem.bind(null, item.id, booking.id)} className="mt-3 space-y-2">
                      <input className="field-input" name="title" defaultValue={item.title} required />
                      <textarea className="field-input" name="description" rows={2} defaultValue={item.description ?? ""} />
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input className="field-input" name="date" type="date" defaultValue={dateInputValue(item.date)} />
                        <input className="field-input" name="time" type="time" defaultValue={timeInputValue(item.date)} />
                        <input className="field-input" name="type" list="timeline-type-suggestions" defaultValue={item.type ?? ""} placeholder="Type" />
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" name="clientVisible" defaultChecked={item.clientVisible} />
                        Client-visible
                      </label>
                      <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">Save</button>
                    </form>
                    {timelineNextStatuses.length > 0 && (
                      <form action={updateTimelineItemStatus.bind(null, item.id, booking.id)} className="mt-2 flex flex-wrap items-center gap-2">
                        <select name="status" defaultValue={timelineNextStatuses[0]} className="field-input w-auto text-xs">
                          {timelineNextStatuses.map((s) => (
                            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                          ))}
                        </select>
                        <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">Update Status</button>
                      </form>
                    )}
                    <form action={deleteTimelineItem.bind(null, item.id, booking.id)} className="mt-2">
                      <button type="submit" className="text-xs text-red-600 hover:underline">Remove</button>
                    </form>
                  </details>
                </li>
              );
            })}
          </ul>
        )}

        <datalist id="timeline-type-suggestions">
          {TIMELINE_TYPE_SUGGESTIONS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>

        <form action={createTimelineItem.bind(null, booking.id)} className="space-y-2 rounded-lg border border-espresso-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Add Timeline Item</p>
          <input className="field-input" name="title" placeholder="Title" required />
          <textarea className="field-input" name="description" rows={2} placeholder="Description (optional)" />
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="field-input" name="date" type="date" />
            <input className="field-input" name="time" type="time" />
            <input className="field-input" name="type" list="timeline-type-suggestions" placeholder="Type (optional)" />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="clientVisible" />
            Client-visible
          </label>
          <button type="submit" className="btn-secondary">+ Add Timeline Item</button>
        </form>
      </section>

      {/* Tasks */}
      <section id="tasks" className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-espresso-700">Tasks</h2>
          <Link href={`/admin/tasks?q=${booking.bookingNumber}`} className="text-xs text-espresso-600 hover:underline">
            View in Task Dashboard →
          </Link>
        </div>

        {booking.tasks.length === 0 ? (
          <p className="mb-4 text-sm text-ink/50">No tasks yet.</p>
        ) : (
          <ul className="mb-6 space-y-3">
            {booking.tasks.map((task) => {
              const taskNextStatuses = getValidTaskStatuses(task.status);
              const overdue = task.dueDate && task.dueDate < new Date() && task.status !== "COMPLETED" && task.status !== "CANCELLED";
              return (
                <li key={task.id} className="rounded-lg border border-espresso-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{task.title}</p>
                      <p className="text-xs text-ink/50">
                        {task.priority} priority
                        {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
                        {task.assignedTo && ` · Assigned to ${task.assignedTo}`}
                        {task.clientVisible && <span className="ml-1 text-espresso-600">· Client-visible</span>}
                      </p>
                      {task.description && <p className="mt-1 text-sm text-ink/70">{task.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {overdue && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Overdue</span>
                      )}
                      <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                        {task.status.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-espresso-600">Edit</summary>
                    <form action={updateTask.bind(null, task.id, booking.id)} className="mt-3 space-y-2">
                      <input className="field-input" name="title" defaultValue={task.title} required />
                      <textarea className="field-input" name="description" rows={2} defaultValue={task.description ?? ""} />
                      <div className="grid gap-2 sm:grid-cols-3">
                        <select className="field-input" name="priority" defaultValue={task.priority}>
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                        <input className="field-input" name="dueDate" type="date" defaultValue={dateInputValue(task.dueDate)} />
                        <input className="field-input" name="assignedTo" placeholder="Assigned to" defaultValue={task.assignedTo ?? ""} />
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" name="clientVisible" defaultChecked={task.clientVisible} />
                        Client-visible
                      </label>
                      <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">Save</button>
                    </form>
                    {taskNextStatuses.length > 0 && (
                      <form action={updateTaskStatus.bind(null, task.id, booking.id)} className="mt-2 flex flex-wrap items-center gap-2">
                        <select name="status" defaultValue={taskNextStatuses[0]} className="field-input w-auto text-xs">
                          {taskNextStatuses.map((s) => (
                            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                          ))}
                        </select>
                        <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">Update Status</button>
                      </form>
                    )}
                    {task.status === "TODO" && (
                      <form action={deleteTask.bind(null, task.id, booking.id)} className="mt-2">
                        <button type="submit" className="text-xs text-red-600 hover:underline">Remove</button>
                      </form>
                    )}
                  </details>
                </li>
              );
            })}
          </ul>
        )}

        <form action={createTask.bind(null, booking.id)} className="space-y-2 rounded-lg border border-espresso-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Add Task</p>
          <input className="field-input" name="title" placeholder="Title" required />
          <textarea className="field-input" name="description" rows={2} placeholder="Description (optional)" />
          <div className="grid gap-2 sm:grid-cols-3">
            <select className="field-input" name="priority" defaultValue="MEDIUM">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <input className="field-input" name="dueDate" type="date" />
            <input className="field-input" name="assignedTo" placeholder="Assigned to (optional)" />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="clientVisible" />
            Client-visible
          </label>
          <button type="submit" className="btn-secondary">+ Add Task</button>
        </form>
      </section>

      {/* Vendor Recommendations */}
      <section id="vendors" className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-1 font-serif text-lg text-espresso-700">Vendor Recommendations</h2>
        <p className="mb-4 text-xs text-ink/40">
          Moira Events recommends vendors — it does not contract, confirm, or pay them. The client decides and
          arranges directly.
        </p>

        {booking.vendorRecommendations.length === 0 ? (
          <p className="mb-4 text-sm text-ink/50">No vendor recommendations yet.</p>
        ) : (
          <ul className="mb-6 space-y-3">
            {booking.vendorRecommendations.map((bv) => (
              <li key={bv.id} className="rounded-lg border border-espresso-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">
                      <Link href={`/admin/vendors/${bv.vendorRecommendation.id}`} className="text-espresso-600 hover:underline">
                        {bv.vendorRecommendation.name}
                      </Link>{" "}
                      {bv.vendorRecommendation.category && (
                        <span className="text-xs text-ink/40">· {bv.vendorRecommendation.category}</span>
                      )}
                    </p>
                    {bv.serviceDescription && <p className="mt-1 text-sm text-ink/70">{bv.serviceDescription}</p>}
                    {bv.clientVisible && <p className="mt-1 text-xs text-espresso-600">Client-visible</p>}
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-espresso-600">Edit</summary>
                  <form action={updateBookingVendor.bind(null, bv.id, booking.id)} className="mt-3 space-y-2">
                    <input className="field-input" name="serviceDescription" placeholder="Service description" defaultValue={bv.serviceDescription ?? ""} />
                    <textarea className="field-input" name="notes" rows={2} placeholder="Internal notes" defaultValue={bv.notes ?? ""} />
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="clientVisible" defaultChecked={bv.clientVisible} />
                      Client-visible
                    </label>
                    <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">Save</button>
                  </form>
                  <form action={unlinkVendorFromBooking.bind(null, bv.id, booking.id)} className="mt-2">
                    <button type="submit" className="text-xs text-red-600 hover:underline">Remove Recommendation</button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}

        {unrecommendedVendors.length > 0 ? (
          <form action={linkVendorToBooking.bind(null, booking.id)} className="space-y-2 rounded-lg border border-espresso-100 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Recommend a Vendor</p>
            <select className="field-input" name="vendorRecommendationId" required defaultValue="">
              <option value="" disabled>Select a vendor recommendation</option>
              {unrecommendedVendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.category ? `(${v.category})` : ""}
                </option>
              ))}
            </select>
            <input className="field-input" name="serviceDescription" placeholder="Service description (optional)" />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="clientVisible" />
              Client-visible
            </label>
            <button type="submit" className="btn-secondary">+ Recommend Vendor</button>
          </form>
        ) : (
          <p className="text-xs text-ink/40">
            No more active recommendations to add. <Link href="/admin/vendors" className="text-espresso-600 hover:underline">Manage vendor recommendations →</Link>
          </p>
        )}
      </section>

      {/* Planning Notes */}
      <section id="planning-notes" className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Planning Notes</h2>
        <p className="mb-4 text-xs text-ink/40">
          A structured, append-only notes log — each entry is marked internal or client-visible.
        </p>

        {booking.planningNoteEntries.length === 0 ? (
          <p className="mb-4 text-sm text-ink/50">No notes yet.</p>
        ) : (
          <ul className="mb-6 space-y-3">
            {booking.planningNoteEntries.map((note) => (
              <li key={note.id} className="rounded-lg border border-espresso-100 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-ink/50">
                    {note.createdAt.toLocaleString()}
                    {note.clientVisible ? (
                      <span className="ml-2 text-espresso-600">Client-visible</span>
                    ) : (
                      <span className="ml-2">Internal</span>
                    )}
                  </span>
                  <form action={deletePlanningNote.bind(null, note.id, booking.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">Remove</button>
                  </form>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-ink/80">{note.content}</p>
              </li>
            ))}
          </ul>
        )}

        <form action={addPlanningNote.bind(null, booking.id)} className="space-y-2 rounded-lg border border-espresso-100 p-4">
          <textarea className="field-input" name="content" rows={3} placeholder="Add a note..." required />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="clientVisible" />
            Client-visible
          </label>
          <button type="submit" className="btn-secondary">+ Add Note</button>
        </form>
      </section>

      {/* Planning Requests */}
      <section id="planning-requests" className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Planning Requests</h2>
        {booking.planningRequests.length === 0 ? (
          <p className="text-sm text-ink/50">No planning requests from the client yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-espresso-200 text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Priority</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-100">
                {booking.planningRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3">
                      <Link href={`/admin/planning-requests/${r.id}`} className="text-espresso-600 hover:underline">
                        {r.subject}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{r.priority}</td>
                    <td className="py-2 pr-3">
                      <span className="rounded-full bg-espresso-100 px-2 py-0.5 text-xs font-medium text-espresso-700">
                        {r.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{r.createdAt.toLocaleDateString()}</td>
                    <td className="py-2">{(r.messages[0]?.createdAt ?? r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Invoices */}
      <section id="invoices" className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-espresso-700">Invoices</h2>
          <form action={createInvoiceFromBooking.bind(null, booking.id)}>
            <button type="submit" className="btn-secondary">
              Create Invoice
            </button>
          </form>
        </div>

        {booking.invoices.length === 0 ? (
          <p className="text-sm text-ink/50">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-espresso-200 text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-2 pr-3">Invoice #</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Paid</th>
                  <th className="py-2">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-100">
                {booking.invoices.map((inv) => {
                  const invSummary = computePaymentSummary(inv.total, booking.payments);
                  return (
                    <tr key={inv.id}>
                      <td className="py-2 pr-3">
                        <Link href={`/admin/invoices/${inv.id}`} className="text-espresso-600 hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="rounded-full bg-espresso-100 px-2 py-0.5 text-xs font-medium text-espresso-700">
                          {inv.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        {money(inv.total)} {inv.currency ?? ""}
                      </td>
                      <td className="py-2 pr-3">{money(invSummary.totalPaid)}</td>
                      <td className="py-2">{money(invSummary.outstandingBalance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {booking.invoices.length > 1 && (
              <p className="mt-3 text-xs text-ink/50">
                Payments are tracked at the booking level — paid/outstanding figures above are not allocated per
                invoice.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Payments */}
      <section id="payments" className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Payments</h2>

        <div className="mb-6 rounded-lg bg-ivory-100 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-ink/60">Agreed Amount</span>
            <span>
              {money(booking.agreedTotal)} {booking.currency ?? ""}
            </span>
          </div>
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
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink/50">
            {paymentSummary.state.replaceAll("_", " ")}
          </p>
        </div>

        {paymentSummary.isOverpaid && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">⚠ Total paid exceeds the agreed amount.</p>
            <p className="mt-1 text-xs">
              This is shown for review only — Moira Events decides manually whether this is a refund, credit, or
              additional agreed service. Nothing is applied automatically.
            </p>
          </div>
        )}

        {booking.payments.length === 0 ? (
          <p className="mb-6 text-sm text-ink/50">No payments recorded yet.</p>
        ) : (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-espresso-200 text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3">Reference</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-100">
                {booking.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3">
                      <Link href={`/admin/payments/${p.id}`} className="text-espresso-600 hover:underline">
                        {money(p.amount)} {p.currency ?? ""}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{p.method ?? "—"}</td>
                    <td className="py-2 pr-3">{p.reference ?? "—"}</td>
                    <td className="py-2 pr-3">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "—"}</td>
                    <td className="py-2">
                      <span className="rounded-full bg-espresso-100 px-2 py-0.5 text-xs font-medium text-espresso-700">
                        {p.status.replaceAll("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form action={recordPayment.bind(null, booking.id)} className="space-y-3 rounded-lg border border-espresso-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Record Payment</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Amount</label>
              <input className="field-input" name="amount" type="number" min={0.01} step="0.01" required />
            </div>
            <div>
              <label className="field-label">Currency</label>
              <select className="field-input" name="currency" defaultValue={booking.currency ?? ""} required>
                <option value="" disabled>
                  Select currency
                </option>
                <option value="RWF">RWF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Type (optional)</label>
              <select className="field-input" name="type" defaultValue="">
                <option value="">Not specified</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="PARTIAL">Partial</option>
                <option value="FINAL">Final</option>
              </select>
            </div>
            <div>
              <label className="field-label">Method</label>
              <input className="field-input" name="method" placeholder="e.g. Bank Transfer, Mobile Money, Cash" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Payment Reference</label>
              <input className="field-input" name="reference" placeholder="e.g. BANK-XXXX" />
            </div>
            <div>
              <label className="field-label">Payment Date</label>
              <input className="field-input" name="paymentDate" type="date" />
            </div>
          </div>
          <div>
            <label className="field-label">
              Status <span className="text-xs text-ink/40">(does not become Paid automatically)</span>
            </label>
            <select className="field-input w-auto" name="status" defaultValue="PENDING">
              {Object.values(PaymentStatus).map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Notes</label>
            <textarea className="field-input" name="notes" rows={2} />
          </div>
          <button type="submit" className="btn-primary">
            Record Payment
          </button>
        </form>
      </section>

      {/* Planning Information */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Planning Information</h2>
        <form action={updateBookingPlanningNotes.bind(null, booking.id)} className="space-y-4">
          <div>
            <label className="field-label">Planning Notes</label>
            <textarea
              className="field-input"
              name="planningNotes"
              rows={3}
              defaultValue={booking.planningNotes ?? ""}
            />
          </div>
          <div>
            <label className="field-label">Internal Notes <span className="text-xs text-ink/40">(staff only)</span></label>
            <textarea
              className="field-input"
              name="internalNotes"
              rows={3}
              defaultValue={booking.internalNotes ?? ""}
            />
          </div>
          <button type="submit" className="btn-primary">
            Save Notes
          </button>
        </form>
      </section>

      {/* Status */}
      <section id="status" className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Status</h2>
        {nextStatuses.length === 0 ? (
          <p className="text-sm text-ink/50">This booking is in a final state — no further status changes.</p>
        ) : (
          <form action={updateBookingStatus.bind(null, booking.id)} className="space-y-3">
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
      {booking.statusHistory.length > 0 && (
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Status History</h2>
          <ul className="space-y-3 text-sm">
            {booking.statusHistory.map((h) => (
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
