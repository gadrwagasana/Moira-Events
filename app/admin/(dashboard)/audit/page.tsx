import Link from "next/link";
import type { Metadata } from "next";
import { getAuditEventsList } from "@/lib/audit/data";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { AuditActorType } from "@/lib/generated/prisma/client";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Audit Log — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string; actorType?: string; entityId?: string; from?: string; to?: string }>;
}) {
  await requireAdminRole("ADMIN");
  const params = await searchParams;
  const entityType = params.entityType ?? "";
  const action = params.action ?? "";
  const actorType = params.actorType ?? "";
  const entityId = params.entityId?.trim() ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";

  const events = await getAuditEventsList({ entityType, action, actorType, entityId, from, to });
  const hasFilters = entityType || action || actorType || entityId || from || to;

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl text-espresso-700">Audit Log</h1>
      <p className="mb-6 text-sm text-ink/60">
        This log is append-only at the application level — no action anywhere in this codebase updates or deletes an
        entry. It is not tamper-proof against direct database access. Staff actions are attributed to the shared
        &ldquo;admin&rdquo; account (no multi-admin identity system exists yet); client actions carry the real client id.
      </p>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="entityType">Entity</label>
          <select className="field-input w-auto" id="entityType" name="entityType" defaultValue={entityType}>
            <option value="">All</option>
            {AUDIT_ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="action">Action</label>
          <select className="field-input w-auto" id="action" name="action" defaultValue={action}>
            <option value="">All</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="actorType">Actor Type</label>
          <select className="field-input w-auto" id="actorType" name="actorType" defaultValue={actorType}>
            <option value="">All</option>
            {Object.values(AuditActorType).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="entityId">Entity Id</label>
          <input className="field-input w-56" id="entityId" name="entityId" type="text" defaultValue={entityId} />
        </div>
        <div>
          <label className="field-label" htmlFor="from">From</label>
          <input className="field-input w-auto" id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div>
          <label className="field-label" htmlFor="to">To</label>
          <input className="field-input w-auto" id="to" name="to" type="date" defaultValue={to} />
        </div>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {hasFilters && (
          <Link href="/admin/audit" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {events.length === 0 ? (
        <p className="text-sm text-ink/60">No audit events match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">Correlation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3 text-ink/60">{event.createdAt.toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {event.actorType === "CLIENT" ? `Client (${event.actorId})` : event.actorType}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/70">{event.action}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {event.entityType} · {event.entityId}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        event.outcome === "FAILURE" ? "bg-red-100 text-red-700" : "bg-espresso-100 text-espresso-700"
                      }`}
                    >
                      {event.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/80">{event.summary}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">
                    {event.beforeValue || event.afterValue
                      ? `${event.beforeValue ?? "—"} → ${event.afterValue ?? "—"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/50" title={event.correlationId ?? undefined}>
                    {event.correlationId ? `${event.correlationId.slice(0, 10)}…` : "—"}
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
