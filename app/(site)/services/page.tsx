import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { CTAButtons } from "@/components/CTAButtons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ServicePageViewTracker } from "@/components/ServicePageViewTracker";
import { divisions } from "@/lib/content/divisions";

export const metadata: Metadata = {
  title: "Services",
  description: "Browse everything Moira Events offers across weddings, parties & social events, and corporate events.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <ServicePageViewTracker page="services" />
      <Breadcrumbs items={[{ label: "Services", href: "/services" }]} />
      <PageHero
        eyebrow="What We Offer"
        title="Services"
        support="Browse everything Moira Events can provide, organized by division. Every event is different, so every quote is custom."
      />

      <section className="section space-y-16">
        {divisions.map((division) => (
          <div key={division.slug} id={division.slug}>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-serif text-2xl text-espresso-700">{division.name}</h2>
              <Link href={`/${division.slug}`} className="text-sm font-semibold text-espresso-600 hover:text-espresso-700">
                Learn more →
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {division.services.map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-espresso-200 bg-ivory-50 px-4 py-1.5 text-sm text-ink/80"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-ivory-200">
        <div className="section text-center">
          <h2 className="font-serif text-2xl text-espresso-700">Pricing</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink/70">
            Moira Events builds a custom quote for every event based on guest count, services required, venue, and
            design complexity. Packages and published pricing are coming soon.
          </p>
          <CTAButtons className="mt-8 justify-center" />
        </div>
      </section>
    </>
  );
}
