import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/client-portal/tokens";
import { ActivateForm } from "./ActivateForm";

export const metadata: Metadata = { title: "Activate Your Portal Account" };
export const dynamic = "force-dynamic";

export default async function PortalActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const client = token
    ? await prisma.client.findUnique({
        where: { inviteTokenHash: hashToken(token) },
        select: { fullName: true, email: true, inviteTokenExpiresAt: true },
      })
    : null;

  const isValid = Boolean(client && client.inviteTokenExpiresAt && client.inviteTokenExpiresAt > new Date());

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-100 px-6">
      <div className="w-full max-w-sm rounded-xl border border-espresso-100 bg-ivory-50 p-8">
        <h1 className="mb-1 text-center font-serif text-2xl text-espresso-700">Moira Events</h1>
        <p className="mb-6 text-center text-sm text-ink/60">Activate Your Client Portal Account</p>

        {isValid && client ? (
          <>
            <p className="mb-4 text-sm text-ink/70">
              Welcome, <span className="font-medium text-ink">{client.fullName}</span>. Set a password for{" "}
              <span className="font-medium text-ink">{client.email}</span> to finish setting up your account.
            </p>
            <ActivateForm token={token!} />
          </>
        ) : (
          <p className="text-sm text-red-600">
            This invitation link is invalid or has expired. Please contact Moira Events for a new link.
          </p>
        )}
      </div>
    </div>
  );
}
