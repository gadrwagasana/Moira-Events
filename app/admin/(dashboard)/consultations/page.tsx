import Link from "next/link";
import type { Metadata } from "next";
import { getConsultationsList } from "@/lib/consultations/data";
import { ConsultationStatus } from "@/lib/generated/prisma/client";

export const metadata: Metadata = { title: "Consultations — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";

  const consultations = await getConsultationsList({ q, status });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-espresso-700">Consultations</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="q">Search</label>
          <input
            className="field-input w-64"
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Reference, name, or email"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select className="field-input w-auto" id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            {Object.values(ConsultationStatus).map((s) => (
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
          <Link href="/admin/consultations" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {consultations.length === 0 ? (
        <p className="text-sm text-ink/60">No consultations match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Preferred Date</th>
                <th className="px-4 py-3">Scheduled Date</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {consultations.map((c) => (
                <tr key={c.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/consultations/${c.id}`} className="font-medium text-espresso-600 hover:underline">
                      {c.referenceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.client.fullName}</td>
                  <td className="px-4 py-3">{c.eventType ?? "—"}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {c.preferredDate ? new Date(c.preferredDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {c.scheduledDate ? new Date(c.scheduledDate).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">{c.method?.replaceAll("_", " ") ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                      {c.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{c.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
