import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/client-portal/tokens";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Reset Password — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

export default async function PortalResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const client = token
    ? await prisma.client.findFirst({
        where: { passwordResetTokenHash: hashToken(token), passwordResetExpiresAt: { gt: new Date() } },
        select: { id: true },
      })
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-100 px-6">
      <div className="w-full max-w-sm rounded-xl border border-espresso-100 bg-ivory-50 p-8">
        <h1 className="mb-1 text-center font-serif text-2xl text-espresso-700">Moira Events</h1>
        <p className="mb-6 text-center text-sm text-ink/60">Reset Your Password</p>

        {client && token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-red-600">
            This password reset link is invalid or has expired.{" "}
            <a href="/portal/forgot-password" className="text-espresso-600 hover:underline">Request a new one</a>.
          </p>
        )}
      </div>
    </div>
  );
}
