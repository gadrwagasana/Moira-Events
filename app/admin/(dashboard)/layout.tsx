import { logout } from "../login/actions";
import { requireAuthenticatedAdmin } from "@/lib/admin/auth";
import { DashboardSidebar, type SidebarItem } from "@/components/DashboardSidebar";
import { listSiteImageSlotsForAdmin } from "@/lib/site-images/data";

// CMS Phase 2 — authenticates (does not role-gate) every /admin/(dashboard)
// route in one place. Deliberately NOT a role check: an EDITOR must reach
// this layout to see their own permitted nav (CMS only) — the ADMIN-only
// areas below are still individually protected by their own
// requireAdminRole("ADMIN") call (see each page.tsx/actions.ts), so
// filtering this nav by role is a convenience for EDITOR, never the actual
// enforcement. Entering a hidden URL by hand still hits that per-page check
// and redirects, exactly as it would if the link were shown.
const OPERATIONS_LINKS: SidebarItem[] = [
  { heading: "Operations" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/consultations", label: "Consultations" },
  { href: "/admin/quotes", label: "Quotes" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/planning-requests", label: "Planning Requests" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/emails", label: "Emails" },
  { href: "/admin/audit", label: "Audit Log" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAuthenticatedAdmin();
  const slots = await listSiteImageSlotsForAdmin();
  const missingCount = slots.filter((s) => !s.data?.imageUrl).length;

  // Visible to both roles — EDITOR can draft/edit pages, posts, image
  // slots, and portfolio items; publish/unpublish/delete still
  // individually require requireAdminRole("ADMIN") inside each action.
  const websiteLinks: SidebarItem[] = [
    { heading: "Website" },
    { href: "/admin/cms", label: "Pages" },
    { href: "/admin/cms/blog", label: "Blog" },
    { href: "/admin/site-images", label: "Site Images", badge: missingCount || undefined },
    { href: "/admin/site-copy", label: "Site Copy" },
    { href: "/admin/portfolio", label: "Portfolio" },
    { href: "/admin/media", label: "Media" },
  ];

  // Settings is ADMIN-only (requireAdminRole("ADMIN") inside the page
  // itself too — this just keeps an EDITOR from seeing a link to a page
  // they'd be redirected straight out of).
  const settingsLinks: SidebarItem[] = [{ heading: "Settings" }, { href: "/admin/settings", label: "Site Settings" }];

  const links =
    admin.role === "ADMIN" ? [...OPERATIONS_LINKS, ...websiteLinks, ...settingsLinks] : websiteLinks;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-espresso-700 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-espresso-400 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <DashboardSidebar
        brand="Moira Events Admin"
        brandHref="/admin/enquiries"
        links={links}
        footer={
          <div>
            {admin.email}
            <br />
            <span className="font-semibold text-espresso-600">{admin.role}</span>
          </div>
        }
        logoutAction={logout}
      />
      <main id="main" className="flex-1 lg:overflow-y-auto lg:px-6 lg:py-10">
        <div className="mx-auto max-w-content px-4 py-6 lg:px-0 lg:py-0">{children}</div>
      </main>
    </div>
  );
}
