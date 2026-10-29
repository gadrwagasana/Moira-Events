"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Footer lives in the shared (site) layout, rendered on every public page —
// but several pages already end in their own "let's get started"-style CTA
// band immediately before it (homepage, both divisions that use
// DivisionPageTemplate, weddings, services, portfolio). This hides
// Footer's own CTA band on exactly those routes so the two never appear
// back-to-back, without needing to restructure every page to render its
// own Footer with its own prop.
const PAGES_WITH_OWN_CTA = new Set([
  "/",
  "/weddings",
  "/corporate-events",
  "/parties-social-events",
  "/services",
  "/portfolio",
]);

// Footer itself is an async Server Component (it fetches Site Settings) —
// a Client Component file cannot import and directly invoke a Server
// Component function (everything a "use client" file imports gets bundled
// for the browser). Instead, the Server Component layout above renders
// BOTH variants of Footer and passes their already-rendered output in as
// children; this component only ever picks one based on the pathname,
// never invokes Footer itself. getSiteSettings is wrapped in
// unstable_cache, so rendering Footer twice costs a cache read, not a
// second live query.
export function SiteFooter({ footerWithCta, footerWithoutCta }: { footerWithCta: ReactNode; footerWithoutCta: ReactNode }) {
  const pathname = usePathname();
  return PAGES_WITH_OWN_CTA.has(pathname) ? footerWithoutCta : footerWithCta;
}
