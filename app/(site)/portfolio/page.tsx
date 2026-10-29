import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { CmsImage } from "@/components/CmsImage";
import { CTAButtons } from "@/components/CTAButtons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { divisions } from "@/lib/content/divisions";
import { listPublishedPortfolioItems, getAllSiteImageSlots } from "@/lib/site-images/data";
import { divisionHeroSlotKey } from "@/lib/site-images/slots";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "A look at the events Moira Events plans across weddings, parties & social events, and corporate events.",
  alternates: { canonical: "/portfolio" },
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const [items, slots] = await Promise.all([listPublishedPortfolioItems(), getAllSiteImageSlots()]);

  return (
    <>
      <Breadcrumbs items={[{ label: "Portfolio", href: "/portfolio" }]} />
      <PageHero
        eyebrow="Our Work"
        title="Portfolio"
        support="A look at real events Moira Events has planned — filter by type, or explore what each division offers below."
      />

      <section className="section">
        <PortfolioGallery
          items={items.map((item) => ({
            id: item.id,
            title: item.title,
            eventType: item.eventType as "WEDDING" | "PARTY" | "CORPORATE",
            guestCount: item.guestCount,
            venueOrCity: item.venueOrCity,
            story: item.story,
            imageUrl: item.imageUrl,
            alt: item.alt,
          }))}
        />
      </section>

      <section className="bg-ivory-200">
        <div className="section">
          <div className="mb-10 text-center md:mb-12">
            <p className="label-eyebrow mb-3">What We Offer</p>
            <h2 className="font-serif text-3xl text-espresso-700">Explore by Division</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {divisions.map((division) => (
              <div key={division.slug} className="card-interactive group relative flex flex-col overflow-hidden">
                <CmsImage
                  slot={slots[divisionHeroSlotKey(division.slug)]}
                  nearbyHeading={division.name}
                  className="aspect-[16/10]"
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-serif text-xl text-espresso-700">{division.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink-muted">{division.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-espresso-600 group-hover:text-espresso-700">
                    <Link href={`/${division.slug}`} className="stretched-link focus-ring rounded">
                      See {division.shortName} in detail
                    </Link>
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section max-w-2xl text-center">
        <p className="text-lg text-ink-muted">
          Every event is shaped around your vision, your guests, and the moments that matter most.
        </p>
        <CTAButtons className="mt-8 justify-center" />
      </section>
    </>
  );
}
