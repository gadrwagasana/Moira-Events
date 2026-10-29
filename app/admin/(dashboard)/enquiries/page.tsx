import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { EnquiryStatus, EventType, Prisma } from "@/lib/generated/prisma/client";
import { requireAdminRole } from "@/lib/admin/auth";
import { StatusBadge, ENQUIRY_STATUS_OPTIONS } from "@/components/StatusBadge";
import { formatDate, toTitleCase } from "@/lib/display-format";
import { EnquiriesFilterBar } from "./EnquiriesFilterBar";

export const metadata: Metadata = { title: "Enquiries — Moira Events Admin" };
export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  WEDDING: "Wedding",
  PARTY: "Party",
  CORPORATE: "Corporate",
  GENERAL: "General",
};
const TYPE_OPTIONS = Object.values(EventType).map((t) => ({ value: t, label: typeLabels[t] ?? t }));

const PAGE_SIZE = 25;
const SORT_KEYS = ["eventDate", "status", "submittedAt"] as const;
type SortKey = (typeof SORT_KEYS)[number];
type SortDir = "asc" | "desc";

function isSortKey(value: string): value is SortKey {
  return (SORT_KEYS as readonly string[]).includes(value);
}

function buildOrderBy(sortBy: SortKey, sortDir: SortDir): Prisma.EnquiryOrderByWithRelationInput {
  if (sortBy === "eventDate") return { event: { eventDate: sortDir } };
  if (sortBy === "status") return { status: sortDir };
  return { submittedAt: sortDir };
}

// Builds an /admin/enquiries?... href from the current query params plus a
// set of overrides (a value of undefined removes that param). Used by both
// the sortable column headers and pagination — neither needs client-side
// JS, since toggling sort/page is just a plain link to a new query string.
function hrefWith(current: Record<string, string | undefined>, overrides: Record<string, string | undefined>): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...overrides })) {
    if (value) next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/admin/enquiries?${qs}` : "/admin/enquiries";
}

function SortableHeader({
  column,
  label,
  currentParams,
  sortBy,
  sortDir,
}: {
  column: SortKey;
  label: string;
  currentParams: Record<string, string | undefined>;
  sortBy: SortKey;
  sortDir: SortDir;
}) {
  const isActive = sortBy === column;
  // First click on a column that isn't active sorts ascending; clicking the
  // already-active column toggles direction — the conventional pattern.
  const nextDir: SortDir = isActive ? (sortDir === "asc" ? "desc" : "asc") : "asc";
  const ariaSort = isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  return (
    <th scope="col" className="px-4 py-3" aria-sort={ariaSort}>
      <Link
        href={hrefWith(currentParams, { sortBy: column, sortDir: nextDir })}
        className="focus-ring inline-flex items-center gap-1 rounded hover:text-espresso-700"
      >
        {label}
        <span aria-hidden="true" className="text-[10px]">
          {isActive ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </Link>
    </th>
  );
}

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string; sortBy?: string; sortDir?: string; page?: string }>;
}) {
  await requireAdminRole("ADMIN");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const type = params.type ?? "";
  const status = params.status ?? "";
  const sortBy: SortKey = params.sortBy && isSortKey(params.sortBy) ? params.sortBy : "submittedAt";
  const sortDir: SortDir = params.sortDir === "asc" ? "asc" : params.sortDir === "desc" ? "desc" : "desc";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

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

  const [totalMatching, enquiries] = await Promise.all([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: buildOrderBy(sortBy, sortDir),
      include: { client: true, event: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const hasFilters = Boolean(q || type || status);
  const totalPages = Math.max(1, Math.ceil(totalMatching / PAGE_SIZE));
  const rangeStart = totalMatching === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalMatching);

  // Only run a second query when the result is actually empty, and only
  // then, to tell apart "no enquiries exist at all" from "no enquiries
  // match these filters" — both render a different empty state.
  const totalUnfiltered = totalMatching === 0 ? await prisma.enquiry.count() : totalMatching;

  const currentParams: Record<string, string | undefined> = {
    q: q || undefined,
    type: type || undefined,
    status: status || undefined,
    sortBy,
    sortDir,
  };

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-espresso-700">Enquiries</h1>

      <EnquiriesFilterBar typeOptions={TYPE_OPTIONS} statusOptions={ENQUIRY_STATUS_OPTIONS} />

      <p className="mb-4 text-sm text-ink/70">
        {totalMatching === 0
          ? "Showing 0 enquiries"
          : `Showing ${rangeStart}–${rangeEnd} of ${totalMatching} enquir${totalMatching === 1 ? "y" : "ies"}`}
      </p>

      {enquiries.length === 0 ? (
        <EmptyState hasFilters={hasFilters} hasAnyEnquiries={totalUnfiltered > 0} />
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="space-y-3 md:hidden">
            {enquiries.map((enq) => (
              <li key={enq.id} className="relative rounded-xl border border-espresso-100 bg-ivory-50 p-4">
                <Link href={`/admin/enquiries/${enq.id}`} className="focus-ring absolute inset-0 rounded-xl">
                  <span className="sr-only">
                    View enquiry {enq.referenceNumber} from {toTitleCase(enq.client.fullName)}
                  </span>
                </Link>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-espresso-700">{enq.referenceNumber}</p>
                    <p className="text-sm text-ink/80">{toTitleCase(enq.client.fullName)}</p>
                  </div>
                  <StatusBadge status={enq.status} />
                </div>
                <dl className="mt-2 space-y-0.5 text-xs text-ink/60">
                  <div className="flex justify-between">
                    <dt>Type</dt>
                    <dd>{typeLabels[enq.event.type] ?? enq.event.type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Event date</dt>
                    <dd>
                      {enq.event.eventDate ? (
                        formatDate(enq.event.eventDate)
                      ) : (
                        <>
                          —<span className="sr-only">Not set</span>
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Submitted</dt>
                    <dd>{formatDate(enq.submittedAt)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-espresso-100 md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Enquiries</caption>
              <thead className="bg-ivory-200 text-xs font-semibold uppercase tracking-wide text-espresso-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Reference</th>
                  <th scope="col" className="px-4 py-3">Client</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <SortableHeader column="eventDate" label="Event Date" currentParams={currentParams} sortBy={sortBy} sortDir={sortDir} />
                  <SortableHeader column="status" label="Status" currentParams={currentParams} sortBy={sortBy} sortDir={sortDir} />
                  <SortableHeader column="submittedAt" label="Submitted" currentParams={currentParams} sortBy={sortBy} sortDir={sortDir} />
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-100">
                {enquiries.map((enq) => (
                  <tr key={enq.id} className="relative hover:bg-ivory-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/enquiries/${enq.id}`}
                        className="stretched-link focus-ring rounded font-medium text-espresso-600 hover:underline"
                      >
                        {enq.referenceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{toTitleCase(enq.client.fullName)}</td>
                    <td className="px-4 py-3">{typeLabels[enq.event.type] ?? enq.event.type}</td>
                    <td className="px-4 py-3">
                      {enq.event.eventDate ? (
                        formatDate(enq.event.eventDate)
                      ) : (
                        <>
                          —<span className="sr-only">Not set</span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={enq.status} />
                    </td>
                    <td className="px-4 py-3 text-ink/70">{formatDate(enq.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-4 text-sm">
              {page > 1 ? (
                <Link href={hrefWith(currentParams, { page: String(page - 1) })} className="focus-ring btn-secondary px-4 py-2">
                  Previous
                </Link>
              ) : (
                <span className="btn-secondary cursor-not-allowed px-4 py-2 opacity-40" aria-disabled="true">
                  Previous
                </span>
              )}
              <span className="text-ink/60">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={hrefWith(currentParams, { page: String(page + 1) })} className="focus-ring btn-secondary px-4 py-2">
                  Next
                </Link>
              ) : (
                <span className="btn-secondary cursor-not-allowed px-4 py-2 opacity-40" aria-disabled="true">
                  Next
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ hasFilters, hasAnyEnquiries }: { hasFilters: boolean; hasAnyEnquiries: boolean }) {
  const showFiltersMessage = hasFilters && hasAnyEnquiries;
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-espresso-200 bg-ivory-50 px-6 py-16 text-center">
      <svg
        aria-hidden="true"
        className="h-10 w-10 text-espresso-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5l9 6 9-6M4.5 6h15a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 16.5v-9A1.5 1.5 0 014.5 6z" />
      </svg>
      <p className="font-medium text-espresso-700">
        {showFiltersMessage ? "No enquiries match your filters" : "No enquiries yet"}
      </p>
      <p className="max-w-sm text-sm text-ink/60">
        {showFiltersMessage
          ? "Try adjusting or clearing your search, type, or status filters."
          : "New enquiries submitted through the public site will appear here."}
      </p>
      {showFiltersMessage && (
        <Link href="/admin/enquiries" className="focus-ring btn-secondary mt-1">
          Clear filters
        </Link>
      )}
    </div>
  );
}
