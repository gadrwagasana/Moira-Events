import Link from "next/link";
import type { Metadata } from "next";
import { getTasksList } from "@/lib/tasks/data";
import { TaskStatus, TaskPriority } from "@/lib/generated/prisma/client";

export const metadata: Metadata = { title: "Tasks — Moira Events Admin" };
export const dynamic = "force-dynamic";

function isOverdue(dueDate: Date | null, status: TaskStatus) {
  return Boolean(dueDate) && dueDate! < new Date() && status !== "COMPLETED" && status !== "CANCELLED";
}

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; overdue?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const priority = params.priority ?? "";
  const overdueOnly = params.overdue === "1";

  const tasks = await getTasksList({ q, status, priority, overdueOnly });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-espresso-700">Tasks</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="q">Search</label>
          <input
            className="field-input w-64"
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Title, description, assignee, booking, client"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select className="field-input w-auto" id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            {Object.values(TaskStatus).map((s) => (
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
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="overdue" value="1" defaultChecked={overdueOnly} />
          Overdue only
        </label>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {(q || status || priority || overdueOnly) && (
          <Link href="/admin/tasks" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {tasks.length === 0 ? (
        <p className="text-sm text-ink/60">No tasks match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {tasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <tr key={task.id} className="hover:bg-ivory-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${task.bookingId}#tasks`} className="font-medium text-espresso-600 hover:underline">
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${task.bookingId}`} className="text-espresso-600 hover:underline">
                        {task.booking.bookingNumber}
                      </Link>{" "}
                      <span className="text-ink/50">· {task.booking.client.fullName}</span>
                    </td>
                    <td className="px-4 py-3">{task.priority}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                        {task.status.replaceAll("_", " ")}
                      </span>
                      {overdue && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink/60">{task.assignedTo || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
