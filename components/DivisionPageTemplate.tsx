import type { ReactNode } from "react";
import Link from "next/link";
import { PageHero } from "./PageHero";
import { PlaceholderImage } from "./PlaceholderImage";
import { CTAButtons } from "./CTAButtons";
import { ServiceJsonLd } from "./ServiceJsonLd";
import { Breadcrumbs } from "./Breadcrumbs";
import { ServicePageViewTracker } from "./ServicePageViewTracker";
import type { Division } from "@/lib/content/divisions";
import { differentiator } from "@/lib/content/company";

export function DivisionPageTemplate({
  division,
  beforeCta,
}: {
  division: Division;
  beforeCta?: ReactNode;
}) {
  return (
    <>
      <ServiceJsonLd division={division} />
      <ServicePageViewTracker page={division.slug} />
      <Breadcrumbs items={[{ label: division.shortName, href: `/${division.slug}` }]} />
      <PageHero eyebrow={division.shortName} title={division.heroTitle} support={division.heroSupport}>
        <CTAButtons quoteLabel={division.ctaLabel} />
      </PageHero>

      <section className="section grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl text-espresso-700">{division.categoriesLabel}</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {division.categories.map((category) => (
              <li
                key={category}
                className="rounded-lg border border-espresso-100 bg-ivory-50 px-4 py-3 text-sm text-ink/80"
              >
                {category}
              </li>
            ))}
          </ul>
        </div>
        <PlaceholderImage label={division.shortName} />
      </section>

      <section className="bg-ivory-200">
        <div className="section">
          <h2 className="font-serif text-2xl text-espresso-700">Services</h2>
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
      </section>

      <section className="section grid items-center gap-12 lg:grid-cols-2">
        <PlaceholderImage label={`${division.shortName} Experience`} className="order-2 lg:order-1" />
        <div className="order-1 lg:order-2">
          <h2 className="font-serif text-2xl text-espresso-700">The Moira Events Experience</h2>
          <p className="mt-4 text-lg italic text-espresso-600">&ldquo;{differentiator}&rdquo;</p>
          <p className="mt-4 text-sm text-ink/70">
            Our team handles planning, vendor coordination, and on-the-day logistics so you can focus on
            experiencing your event, not managing it.
          </p>
        </div>
      </section>

      {beforeCta}

      <section className="border-t border-espresso-100 bg-espresso-600">
        <div className="section flex flex-col items-center gap-6 text-center">
          <h2 className="font-serif text-3xl text-ivory-100">Ready to Start Planning?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={division.ctaHref} className="btn bg-ivory-100 text-espresso-700 hover:bg-ivory-200">
              {division.ctaLabel}
            </Link>
            <Link
              href="/book-a-consultation"
              className="btn border border-ivory-100 text-ivory-100 hover:bg-espresso-700"
            >
              Book a Consultation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
