import { siteConfig } from "@/lib/content/config";

// Only confirmed facts from lib/content/config.ts — no address, rating,
// founding date, or social links exist in the data layer, so none are
// included here. Rendered once per public page via app/(site)/layout.tsx.
export function OrganizationJsonLd() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const graph = [
    {
      "@type": "Organization",
      name: siteConfig.name,
      url: appUrl,
      email: siteConfig.email,
      telephone: `+${siteConfig.whatsappNumber}`,
      address: {
        "@type": "PostalAddress",
        addressCountry: "RW",
      },
      areaServed: siteConfig.country,
    },
    {
      "@type": "WebSite",
      name: siteConfig.name,
      url: appUrl,
    },
  ];

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  // JSON-LD must be injected unescaped (JSX children would HTML-escape the
  // quotes and break the JSON) — standard Next.js pattern for structured
  // data. Every value above comes from lib/content/config.ts constants, not
  // user input, so there is no injection risk.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
