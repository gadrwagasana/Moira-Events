import Link from "next/link";
import { logout } from "../login/actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="flex items-center justify-between border-b border-espresso-100 bg-ivory-50 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin/enquiries" className="font-serif text-lg text-espresso-700">
            Moira Events Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-ink/70">
            <Link href="/admin/enquiries" className="hover:text-espresso-600">
              Enquiries
            </Link>
            <Link href="/admin/consultations" className="hover:text-espresso-600">
              Consultations
            </Link>
            <Link href="/admin/quotes" className="hover:text-espresso-600">
              Quotes
            </Link>
            <Link href="/admin/bookings" className="hover:text-espresso-600">
              Bookings
            </Link>
            <Link href="/admin/payments" className="hover:text-espresso-600">
              Payments
            </Link>
            <Link href="/admin/invoices" className="hover:text-espresso-600">
              Invoices
            </Link>
            <Link href="/admin/tasks" className="hover:text-espresso-600">
              Tasks
            </Link>
            <Link href="/admin/vendors" className="hover:text-espresso-600">
              Vendors
            </Link>
            <Link href="/admin/planning-requests" className="hover:text-espresso-600">
              Planning Requests
            </Link>
            <Link href="/admin/documents" className="hover:text-espresso-600">
              Documents
            </Link>
            <Link href="/admin/audit" className="hover:text-espresso-600">
              Audit Log
            </Link>
            <Link href="/admin/analytics" className="hover:text-espresso-600">
              Analytics
            </Link>
          </nav>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm font-medium text-espresso-600 hover:underline">
            Log Out
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-content px-6 py-10">{children}</main>
    </div>
  );
}
