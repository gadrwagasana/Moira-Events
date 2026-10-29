import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPlanningRequestDetail } from "@/lib/planning-requests/data";
import { getValidNextStatuses } from "@/lib/planning-requests/transitions";
import { TaskPriority } from "@/lib/generated/prisma/client";
import { respondToPlanningRequest, updatePlanningRequestStatus, updatePlanningRequestPriority } from "../actions";
import { getLatestEmailDelivery } from "@/lib/email/outbox";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Planning Request — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPlanningRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole("ADMIN");
  const { id } = await params;
  const request = await getPlanningRequestDetail(id);
  if (!request) notFound();

  const nextStatuses = getValidNextStatuses(request.status);
  const isClosed = request.status === "RESOLVED" || request.status === "CANCELLED";
  // PLANNING_RESPONSE deliveries are keyed by the staff message's own id
  // (lib/email/outbox.ts), not the request id, so find the latest one.
  const latestStaffMessage = [...request.messages].reverse().find((m) => m.senderType === "STAFF");
  const lastDelivery = latestStaffMessage ? await getLatestEmailDelivery("PLANNING_RESPONSE", latestStaffMessage.id) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">
            <Link href={`/admin/bookings/${request.booking.id}`} className="hover:underline">
              {request.booking.bookingNumber}
            </Link>{" "}
            · {request.client.fullName}
          </p>
          <h1 className="font-serif text-2xl text-espresso-700">{request.subject}</h1>
          <p className="text-sm text-ink/60">Submitted {request.createdAt.toLocaleString()}</p>
        </div>
        <span className="rounded-full bg-espresso-100 px-3 py-1.5 text-sm font-medium text-espresso-700">
          {request.status.replaceAll("_", " ")}
        </span>
      </div>

      {/* Thread */}
      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Conversation</h2>
        <ul className="space-y-4">
          <ThreadEntry sender="CLIENT" senderLabel={request.client.fullName} message={request.message} createdAt={request.createdAt} />
          {request.messages.map((m) => (
            <ThreadEntry
              key={m.id}
              sender={m.senderType}
              senderLabel={m.senderType === "STAFF" ? "Moira Events" : request.client.fullName}
              message={m.message}
              createdAt={m.createdAt}
            />
          ))}
        </ul>

        {!isClosed && (
          <form action={respondToPlanningRequest.bind(null, request.id)} className="mt-6 space-y-2 border-t border-espresso-100 pt-4">
            <label className="field-label">Respond</label>
            <textarea className="field-input" name="message" rows={3} required placeholder="Write a response..." />
            <button type="submit" className="btn-primary">
              Send Response
            </button>
          </form>
        )}
        {lastDelivery && (
          <p className="mt-3 text-xs text-ink/50">
            Last client notification {lastDelivery.createdAt.toLocaleString()} to {lastDelivery.recipientEmail} —{" "}
            <span className={lastDelivery.status === "FAILED" ? "text-red-600" : "text-ink/60"}>
              {lastDelivery.status === "FAILED" ? `Failed: ${lastDelivery.lastError}` : lastDelivery.status}
            </span>
          </p>
        )}
      </section>

      {/* Status & Priority */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Status</h2>
          {nextStatuses.length === 0 ? (
            <p className="text-sm text-ink/50">This request is in a final state — no further status changes.</p>
          ) : (
            <form action={updatePlanningRequestStatus.bind(null, request.id)} className="space-y-3">
              <select name="status" defaultValue={nextStatuses[0]} className="field-input w-auto">
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary">
                Update Status
              </button>
            </form>
          )}
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Priority</h2>
          <form action={updatePlanningRequestPriority.bind(null, request.id)} className="space-y-3">
            <select name="priority" defaultValue={request.priority} className="field-input w-auto">
              {Object.values(TaskPriority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary">
              Update Priority
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function ThreadEntry({
  sender,
  senderLabel,
  message,
  createdAt,
}: {
  sender: "CLIENT" | "STAFF";
  senderLabel: string;
  message: string;
  createdAt: Date;
}) {
  return (
    <li className={`rounded-lg border p-4 ${sender === "STAFF" ? "border-espresso-200 bg-ivory-100" : "border-espresso-100 bg-ivory-50"}`}>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-ink/50">
        <span className="font-semibold uppercase tracking-wide text-espresso-700">
          {sender === "STAFF" ? "Moira Events" : senderLabel}
        </span>
        <span>{createdAt.toLocaleString()}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-ink/80">{message}</p>
    </li>
  );
}
