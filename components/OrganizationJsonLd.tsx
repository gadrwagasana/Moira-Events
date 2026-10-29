import { siteConfig } from "@/lib/content/config";
import { getSiteSettings } from "@/lib/settings/data";

// Rendered once per public page via app/(site)/layout.tsx (a Server
// Component, so this being async is fine — React awaits it during the RSC
// render pass without the parent itself needing to be async). Reads from
// Site Settings now instead of only the hardcoded siteConfig constants, so
// an admin editing the phone/email/social links in /admin/settings updates
// this structured data too, not just the visible page text.
export async function OrganizationJsonLd() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const settings = await getSiteSettings();

  const sameAs = [settings.instagramUrl, settings.facebookUrl, settings.tiktokUrl, settings.linkedinUrl, settings.youtubeUrl].filter(
    (url): url is string => Boolean(url),
  );

  const graph = [
    {
      "@type": "Organization",
      name: settings.siteName,
      url: appUrl,
      ...(settings.contactEmail && { email: settings.contactEmail }),
      ...(settings.phoneE164 && { telephone: settings.phoneE164 }),
      address: {
        "@type": "PostalAddress",
        addressCountry: "RW",
        ...(settings.city && { addressLocality: settings.city }),
        ...(settings.addressLine && { streetAddress: settings.addressLine }),
      },
      areaServed: siteConfig.country,
      ...(sameAs.length > 0 && { sameAs }),
    },
    {
      "@type": "WebSite",
      name: settings.siteName,
      url: appUrl,
    },
  ];

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  // JSON-LD must be injected unescaped (JSX children would HTML-escape the
  // quotes and break the JSON) — standard Next.js pattern for structured
  // data. Every value above comes from Site Settings (admin-only, server-
  // validated input) or the siteConfig constant, never unsanitized visitor
  // input, so there is no injection risk.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
