import Link from "next/link";

type Crumb = { label: string; href: string };

// Renders both the visible trail AND its JSON-LD in one place, so the
// structured data can never drift from what's actually on the page
// (Stage P requirement: "structured data reflects visible page content").
// `items` excludes Home — it's always prepended.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const trail = [{ label: "Home", href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${appUrl}${crumb.href}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="section pb-0 pt-6 text-sm text-ink/60">
        <ol className="flex flex-wrap items-center gap-1">
          {trail.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === trail.length - 1 ? (
                <span aria-current="page" className="text-ink/80">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-espresso-600">
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
