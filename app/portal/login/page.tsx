import type { Metadata } from "next";
import { ClientLoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Client Portal Login" };

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-100 px-6">
      <div className="w-full max-w-sm rounded-xl border border-espresso-100 bg-ivory-50 p-8">
        <h1 className="mb-1 text-center font-serif text-2xl text-espresso-700">Moira Events</h1>
        <p className="mb-6 text-center text-sm text-ink/60">Client Portal</p>
        {reset && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-700">
            Your password has been reset. Sign in with your new password.
          </p>
        )}
        <ClientLoginForm />
      </div>
    </div>
  );
}
