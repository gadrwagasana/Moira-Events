import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/client-portal/tokens";
import { confirmEmailVerification } from "./actions";
import { ResendForm } from "./ResendForm";

export const metadata: Metadata = { title: "Verify Your Email — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

export default async function PortalVerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string; invalid?: string }>;
}) {
  const { token, email, invalid } = await searchParams;

  let pendingClient: { fullName: string } | null = null;
  if (token) {
    pendingClient = await prisma.client.findFirst({
      where: { emailVerificationTokenHash: hashToken(token), emailVerificationExpiresAt: { gt: new Date() } },
      select: { fullName: true },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-100 px-6 py-12">
      <div className="w-full max-w-sm rounded-xl border border-espresso-100 bg-ivory-50 p-8 text-center">
        <h1 className="mb-1 font-serif text-2xl text-espresso-700">Moira Events</h1>

        {token ? (
          pendingClient ? (
            <>
              <p className="mt-4 mb-6 text-sm text-ink/70">
                Hi {pendingClient.fullName}, confirm this is your email address to finish setting up your account.
              </p>
              <form action={confirmEmailVerification.bind(null, token)}>
                <button type="submit" className="btn-primary w-full">
                  Confirm Email Address
                </button>
              </form>
            </>
          ) : (
            <p className="mt-4 text-sm text-red-600">
              This verification link is invalid or has expired. Request a new one below.
            </p>
          )
        ) : (
          <>
            <p className="mt-4 text-sm text-ink/70">
              {invalid
                ? "That verification link is invalid or has expired."
                : "Check your email — we sent a verification link to your email address."}
            </p>
            <ResendForm email={email ?? ""} />
          </>
        )}

        <p className="mt-6 text-xs text-ink/40">
          <a href="/portal/login" className="hover:underline">Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
