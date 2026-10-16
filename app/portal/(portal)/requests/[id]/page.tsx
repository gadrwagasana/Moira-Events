import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getPlanningRequestDetailForClient } from "@/lib/client-portal/data";
import { FollowUpForm } from "./FollowUpForm";

export const metadata: Metadata = { title: "Planning Request — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

export default async function PortalRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = await requireAuthenticatedClientId();
  const request = await getPlanningRequestDetailForClient(clientId, id);
  if (!request) notFound();

  const isClosed = request.status === "RESOLVED" || request.status === "CANCELLED";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-1">{request.booking.bookingNumber}</p>
          <h1 className="font-serif text-2xl text-espresso-700">{request.subject}</h1>
          <p className="text-sm text-ink/60">Submitted {request.createdAt.toLocaleString()}</p>
        </div>
        <span className="rounded-full bg-espresso-100 px-3 py-1.5 text-sm font-medium text-espresso-700">
          {request.status.replaceAll("_", " ")}
        </span>
      </div>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Conversation</h2>
        <ul className="space-y-4">
          <ThreadEntry sender="CLIENT" message={request.message} createdAt={request.createdAt} />
          {request.messages.map((m) => (
            <ThreadEntry key={m.id} sender={m.senderType} message={m.message} createdAt={m.createdAt} />
          ))}
        </ul>

        {isClosed ? (
          <p className="mt-6 border-t border-espresso-100 pt-4 text-xs text-ink/40">
            This request is closed. Contact us or submit a new request if you need anything further.
          </p>
        ) : (
          <FollowUpForm requestId={request.id} />
        )}
      </section>
    </div>
  );
}

function ThreadEntry({ sender, message, createdAt }: { sender: "CLIENT" | "STAFF"; message: string; createdAt: Date }) {
  return (
    <li className={`rounded-lg border p-4 ${sender === "STAFF" ? "border-espresso-200 bg-ivory-100" : "border-espresso-100 bg-ivory-50"}`}>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-ink/50">
        <span className="font-semibold uppercase tracking-wide text-espresso-700">
          {sender === "STAFF" ? "Moira Events" : "You"}
        </span>
        <span>{createdAt.toLocaleString()}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-ink/80">{message}</p>
    </li>
  );
}
