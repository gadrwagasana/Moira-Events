import { siteConfig } from "@/lib/content/config";
import type { Division } from "@/lib/content/divisions";

// One Service block per division page, sourced entirely from the division's
// own (already client-safe) name/summary — no price, rating, or offer data
// exists in the data layer, so none is included.
export function ServiceJsonLd({ division }: { division: Division }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: division.name,
    description: division.summary,
    provider: { "@type": "Organization", name: siteConfig.name },
    areaServed: siteConfig.country,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
