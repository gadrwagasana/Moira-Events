import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SiteFooter } from "@/components/SiteFooter";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";

// Sitewide Open Graph/Twitter defaults for the public marketing site only
// (scoped here, not in the root layout, so admin/portal pages never carry
// marketing social-card metadata). Individual pages can still override
// title/description via their own metadata export; this supplies the rest.
export const metadata: Metadata = {
  openGraph: {
    siteName: "Moira Events",
    type: "website",
    locale: "en_US",
    images: [{ url: "/images/moira-events-logo.png", width: 1496, height: 706, alt: "Moira Events" }],
  },
  twitter: {
    card: "summary",
    images: ["/images/moira-events-logo.png"],
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-espresso-700 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-espresso-400 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <OrganizationJsonLd />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter footerWithCta={<Footer showCta />} footerWithoutCta={<Footer showCta={false} />} />
    </div>
  );
}
