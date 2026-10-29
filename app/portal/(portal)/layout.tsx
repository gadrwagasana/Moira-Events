import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getClientProfile } from "@/lib/client-portal/data";
import { logoutClient } from "../login/actions";
import { DashboardSidebar, type SidebarLink } from "@/components/DashboardSidebar";

const PORTAL_LINKS: SidebarLink[] = [
  { href: "/portal/dashboard", label: "Dashboard" },
  { href: "/portal/event", label: "My Event" },
  { href: "/portal/quote", label: "My Quote" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/payments", label: "Payments" },
  { href: "/portal/requests", label: "Requests" },
  { href: "/portal/profile", label: "Profile" },
];

export default async function PortalDashboardLayout({ children }: { children: React.ReactNode }) {
  const clientId = await requireAuthenticatedClientId();
  const client = await getClientProfile(clientId);

  return (
    <div className="flex min-h-screen flex-col bg-ivory-100 lg:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-espresso-700 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-espresso-400 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <DashboardSidebar
        brand="Moira Events"
        brandHref="/portal/dashboard"
        links={PORTAL_LINKS}
        footer={client ? <div>{client.fullName}</div> : undefined}
        logoutAction={logoutClient}
      />
      <main id="main" className="flex-1 lg:overflow-y-auto lg:px-6 lg:py-10">
        <div className="mx-auto max-w-content px-4 py-6 lg:px-0 lg:py-0">{children}</div>
      </main>
    </div>
  );
}
