import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-retry";
import { EnquiryStatus } from "@/lib/generated/prisma/client";
import { updateEnquiryStatus } from "../actions";
import { addCommunicationNote } from "../communication-actions";
import { createQuoteFromEnquiry } from "../../quotes/actions";
import { requireAdminRole } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Enquiry Detail — Moira Events Admin" };
export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  WEDDING: "Wedding",
  PARTY: "Party",
  CORPORATE: "Corporate",
  GENERAL: "General",
};

export default async function AdminEnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole("ADMIN");
  const { id } = await params;

  const enquiry = await withDbRetry(() =>
    prisma.enquiry.findUnique({
      where: { id },
      include: {
        client: true,
        event: { include: { weddingType: true } },
        services: { include: { service: true } },
        quotes: { orderBy: { createdAt: "desc" } },
      },
    }),
  );

  if (!enquiry) notFound();

  // Sequential, not Promise.all — the main record above already used one
  // connection; firing two more in parallel immediately after is exactly
  // the kind of concurrent-connection burst that's triggered "Server has
  // closed the connection" against this project's local database, and a
  // constrained production pool is vulnerable to the same pressure. These
  // two queries are supplementary (an activity sidebar), not required for
  // the page's main content, so the small latency cost of running them one
  // after another is the right trade here.
  const otherEnquiries = await withDbRetry(() =>
    prisma.enquiry.findMany({
      where: { clientId: enquiry.clientId, id: { not: enquiry.id } },
      orderBy: { submittedAt: "desc" },
      select: { id: true, referenceNumber: true, submittedAt: true, status: true, event: { select: { type: true } } },
    }),
  );
  const communications = await withDbRetry(() =>
    prisma.communication.findMany({
      where: { enquiryId: enquiry.id },
      orderBy: { createdAt: "desc" },
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="label-eyebrow mb-1">
          {enquiry.referenceNumber} · {typeLabels[enquiry.event.type] ?? enquiry.event.type}
        </p>
        <h1 className="font-serif text-2xl text-espresso-700">{enquiry.client.fullName}</h1>
        <p className="text-sm text-ink/60">Submitted {enquiry.submittedAt.toLocaleString()}</p>
      </div>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Quote</h2>
        {enquiry.quotes.length === 0 ? (
          <form action={createQuoteFromEnquiry.bind(null, enquiry.id)}>
            <button type="submit" className="btn-primary">
              Create Quote
            </button>
          </form>
        ) : (
          <div className="space-y-2">
            <ul className="space-y-1">
              {enquiry.quotes.map((q) => (
                <li key={q.id} className="flex items-center justify-between text-sm">
                  <Link href={`/admin/quotes/${q.id}`} className="font-medium text-espresso-600 hover:underline">
                    {q.quoteNumber} · v{q.version}
                  </Link>
                  <span className="rounded-full bg-espresso-100 px-2.5 py-1 text-xs font-medium text-espresso-700">
                    {q.status.replaceAll("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
            <form action={createQuoteFromEnquiry.bind(null, enquiry.id)}>
              <button type="submit" className="text-sm text-espresso-600 hover:underline">
                + Create Another Quote
              </button>
            </form>
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Client</h2>
          <dl className="space-y-1 text-sm">
            <Row label="Name" value={enquiry.client.fullName} />
            <Row label="Email" value={enquiry.client.email} />
            <Row label="Phone" value={enquiry.client.phone} />
            <Row label="WhatsApp" value={enquiry.client.whatsapp} />
            <Row label="Preferred Contact" value={enquiry.client.preferredContactMethod} />
          </dl>

          {otherEnquiries.length > 0 && (
            <div className="mt-4 border-t border-espresso-100 pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50">
                Other enquiries from this client
              </p>
              <ul className="space-y-1">
                {otherEnquiries.map((o) => (
                  <li key={o.id} className="flex items-center justify-between text-sm">
                    <Link href={`/admin/enquiries/${o.id}`} className="text-espresso-600 hover:underline">
                      {o.referenceNumber} · {typeLabels[o.event.type] ?? o.event.type}
                    </Link>
                    <span className="text-xs text-ink/50">{o.status.replaceAll("_", " ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Event</h2>
          <dl className="space-y-1 text-sm">
            {enquiry.event.weddingType && <Row label="Wedding Type" value={enquiry.event.weddingType.name} />}
            {enquiry.event.eventSubtype && <Row label="Event Type" value={enquiry.event.eventSubtype} />}
            <Row label="Date" value={enquiry.event.eventDate?.toLocaleDateString()} />
            <Row label="Location" value={enquiry.event.location} />
            <Row label="Ceremony Location" value={enquiry.event.ceremonyLocation} />
            <Row label="Reception Location" value={enquiry.event.receptionLocation} />
            <Row label="Estimated Guests" value={enquiry.event.estimatedGuests?.toString()} />
          </dl>
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Services Requested</h2>
          {enquiry.services.length === 0 ? (
            <p className="text-sm text-ink/50">None selected.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {enquiry.services.map((es) => (
                <li key={es.id} className="rounded-full border border-espresso-200 px-3 py-1 text-xs text-ink/80">
                  {es.service.name}
                </li>
              ))}
            </ul>
          )}
          {enquiry.otherServicesNote && (
            <p className="mt-3 text-sm text-ink/70">
              <span className="font-medium">Other: </span>
              {enquiry.otherServicesNote}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
          <h2 className="mb-3 font-serif text-lg text-espresso-700">Budget &amp; Message</h2>
          <dl className="space-y-1 text-sm">
            <Row
              label="Budget"
              value={enquiry.budgetAmount ? `${enquiry.budgetAmount.toString()} ${enquiry.budgetCurrency ?? ""}` : undefined}
            />
          </dl>
          {enquiry.message && <p className="mt-3 whitespace-pre-wrap text-sm text-ink/70">{enquiry.message}</p>}
        </section>
      </div>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-3 font-serif text-lg text-espresso-700">Status</h2>
        <form action={updateEnquiryStatus.bind(null, enquiry.id)} className="flex flex-wrap items-center gap-3">
          <select name="status" defaultValue={enquiry.status} className="field-input w-auto">
            {Object.values(EnquiryStatus).map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            Update Status
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Follow-Up Timeline</h2>

        <form action={addCommunicationNote.bind(null, enquiry.id)} className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-3">
            <select name="channel" defaultValue="Note" className="field-input w-auto">
              <option value="Call">Call</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
              <option value="Note">Note</option>
            </select>
          </div>
          <textarea
            name="message"
            rows={3}
            required
            placeholder="What happened? e.g. &quot;Called client, confirmed guest count is 150.&quot;"
            className="field-input"
          />
          <button type="submit" className="btn-secondary">
            Add Note
          </button>
        </form>

        {communications.length === 0 ? (
          <p className="text-sm text-ink/50">No follow-up notes yet.</p>
        ) : (
          <ul className="space-y-4 border-t border-espresso-100 pt-4">
            {communications.map((c) => (
              <li key={c.id} className="text-sm">
                <div className="flex items-center gap-2 text-xs text-ink/50">
                  <span className="rounded-full bg-espresso-100 px-2 py-0.5 font-medium text-espresso-700">
                    {c.channel ?? "Note"}
                  </span>
                  <span>{c.createdAt.toLocaleString()}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-ink/80">{c.message}</p>
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
