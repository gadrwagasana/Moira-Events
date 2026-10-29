import Link from "next/link";
import type { Metadata } from "next";
import { getPlanningRequestsList } from "@/lib/planning-requests/data";
import { PlanningRequestStatus, TaskPriority } from "@/lib/generated/prisma/client";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Planning Requests — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPlanningRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string }>;
}) {
  await requireAdminRole("ADMIN");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const priority = params.priority ?? "";

  const requests = await getPlanningRequestsList({ q, status, priority });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-espresso-700">Planning Requests</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="q">Search</label>
          <input
            className="field-input w-64"
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Subject, message, client, booking"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select className="field-input w-auto" id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            {Object.values(PlanningRequestStatus).map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="priority">Priority</label>
          <select className="field-input w-auto" id="priority" name="priority" defaultValue={priority}>
            <option value="">All</option>
            {Object.values(TaskPriority).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {(q || status || priority) && (
          <Link href="/admin/planning-requests" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {requests.length === 0 ? (
        <p className="text-sm text-ink/60">No planning requests found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/planning-requests/${r.id}`} className="font-medium text-espresso-600 hover:underline">
                      {r.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.client.fullName}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/bookings/${r.booking.id}`} className="text-espresso-600 hover:underline">
                      {r.booking.bookingNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.priority}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                      {r.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {(r.messages[0]?.createdAt ?? r.createdAt).toLocaleDateString()}
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
