import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { CTAButtons } from "@/components/CTAButtons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { divisions } from "@/lib/content/divisions";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "A look at the events Moira Events plans across weddings, parties & social events, and corporate events.",
  alternates: { canonical: "/portfolio" },
};

// No real project photography or case studies exist yet (confirmed — every
// image area on this site is still a styled placeholder pending the owner
// supplying real photography). Rather than show an empty gallery or invent
// project details, this page honestly previews what each division covers
// and routes to the real, already-built division pages for detail — no
// fabricated projects, clients, or images.
export default function PortfolioPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Portfolio", href: "/portfolio" }]} />
      <PageHero
        eyebrow="Our Work"
        title="Portfolio"
        support="Real photography from past events is coming soon. In the meantime, here's what Moira Events plans across each division — and the detail behind every one of them."
      />
      <section className="section grid gap-8 md:grid-cols-3">
        {divisions.map((division) => (
          <div key={division.slug} className="card-interactive flex flex-col overflow-hidden">
            <PlaceholderImage label={division.shortName} className="aspect-[16/10] rounded-none" />
            <div className="flex flex-1 flex-col p-6">
              <h2 className="font-serif text-xl text-espresso-700">{division.name}</h2>
              <p className="mt-2 flex-1 text-sm text-ink/70">{division.summary}</p>
              <Link
                href={`/${division.slug}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-espresso-600 hover:text-espresso-700"
              >
                See {division.shortName} in detail
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ))}
      </section>
      <section className="section max-w-2xl text-center">
        <p className="text-lg text-ink/70">
          Every event is shaped around your vision, your guests, and the moments that matter most.
        </p>
        <CTAButtons className="mt-8 justify-center" />
      </section>
    </>
  );
}
