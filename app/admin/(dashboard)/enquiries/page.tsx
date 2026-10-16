import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { EnquiryStatus, EventType, Prisma } from "@/lib/generated/prisma/client";

export const metadata: Metadata = { title: "Enquiries — Moira Events Admin" };
export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  WEDDING: "Wedding",
  PARTY: "Party",
  CORPORATE: "Corporate",
  GENERAL: "General",
};

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const type = params.type ?? "";
  const status = params.status ?? "";

  const where: Prisma.EnquiryWhereInput = {
    ...(type && Object.values(EventType).includes(type as EventType) ? { event: { type: type as EventType } } : {}),
    ...(status && Object.values(EnquiryStatus).includes(status as EnquiryStatus)
      ? { status: status as EnquiryStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { referenceNumber: { contains: q, mode: "insensitive" } },
            { client: { fullName: { contains: q, mode: "insensitive" } } },
            { client: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const enquiries = await prisma.enquiry.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: { client: true, event: true },
  });

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-espresso-700">Enquiries</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="q">Search</label>
          <input
            className="field-input w-64"
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Name, email, or reference"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="type">Type</label>
          <select className="field-input w-auto" id="type" name="type" defaultValue={type}>
            <option value="">All</option>
            {Object.values(EventType).map((t) => (
              <option key={t} value={t}>
                {typeLabels[t] ?? t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select className="field-input w-auto" id="status" name="status" defaultValue={status}>
            <option value="">All</option>
            {Object.values(EnquiryStatus).map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {(q || type || status) && (
          <Link href="/admin/enquiries" className="text-sm text-espresso-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {enquiries.length === 0 ? (
        <p className="text-sm text-ink/60">No enquiries match.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-espresso-100">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-ivory-200 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Event Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100">
              {enquiries.map((enq) => (
                <tr key={enq.id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/enquiries/${enq.id}`} className="font-medium text-espresso-600 hover:underline">
                      {enq.referenceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{enq.client.fullName}</td>
                  <td className="px-4 py-3">{typeLabels[enq.event.type] ?? enq.event.type}</td>
                  <td className="px-4 py-3">
                    {enq.event.eventDate ? new Date(enq.event.eventDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                      {enq.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{enq.submittedAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
