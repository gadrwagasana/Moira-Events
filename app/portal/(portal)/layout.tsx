import Link from "next/link";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getClientProfile } from "@/lib/client-portal/data";
import { logoutClient } from "../login/actions";

export default async function PortalDashboardLayout({ children }: { children: React.ReactNode }) {
  const clientId = await requireAuthenticatedClientId();
  const client = await getClientProfile(clientId);

  return (
    <div className="min-h-screen bg-ivory-100">
      <header className="border-b border-espresso-100 bg-ivory-50 px-6 py-4">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/portal/dashboard" className="font-serif text-lg text-espresso-700">
              Moira Events
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-ink/70">
              <Link href="/portal/dashboard" className="hover:text-espresso-600">
                Dashboard
              </Link>
              <Link href="/portal/event" className="hover:text-espresso-600">
                My Event
              </Link>
              <Link href="/portal/quote" className="hover:text-espresso-600">
                My Quote
              </Link>
              <Link href="/portal/invoices" className="hover:text-espresso-600">
                Invoices
              </Link>
              <Link href="/portal/payments" className="hover:text-espresso-600">
                Payments
              </Link>
              <Link href="/portal/requests" className="hover:text-espresso-600">
                Requests
              </Link>
              <Link href="/portal/profile" className="hover:text-espresso-600">
                Profile
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {client && <span className="text-ink/60">{client.fullName}</span>}
            <form action={logoutClient}>
              <button type="submit" className="font-medium text-espresso-600 hover:underline">
                Log Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-content px-6 py-10">{children}</main>
    </div>
  );
}
