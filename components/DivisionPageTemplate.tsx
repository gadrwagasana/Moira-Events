import type { ReactNode } from "react";
import Link from "next/link";
import { PageHero } from "./PageHero";
import { CmsImage } from "./CmsImage";
import { CTAButtons } from "./CTAButtons";
import { ServiceJsonLd } from "./ServiceJsonLd";
import { Breadcrumbs } from "./Breadcrumbs";
import { ServicePageViewTracker } from "./ServicePageViewTracker";
import type { Division } from "@/lib/content/divisions";
import { differentiator } from "@/lib/content/company";
import { getAllSiteImageSlots } from "@/lib/site-images/data";
import { divisionHeroSlotKey, divisionTeamSlotKey } from "@/lib/site-images/slots";

export async function DivisionPageTemplate({
  division,
  beforeCta,
  heroEyebrowOverride,
  heroHeadlineOverride,
  heroBodyOverride,
  categoriesHeadingOverride,
  servicesHeadingOverride,
  experienceHeadingOverride,
  experienceTaglineOverride,
  experienceBodyOverride,
  ctaHeadingOverride,
}: {
  division: Division;
  beforeCta?: ReactNode;
  // All nine optional — a caller that passes none of them (e.g. Corporate)
  // renders exactly as before; only a caller that explicitly supplies a
  // value (e.g. Parties, via its own getSiteCopy() lookup) can change that
  // one field, and only for its own page.
  heroEyebrowOverride?: string | null;
  heroHeadlineOverride?: string | null;
  heroBodyOverride?: string | null;
  categoriesHeadingOverride?: string | null;
  servicesHeadingOverride?: string | null;
  experienceHeadingOverride?: string | null;
  experienceTaglineOverride?: string | null;
  experienceBodyOverride?: string | null;
  ctaHeadingOverride?: string | null;
}) {
  const slots = await getAllSiteImageSlots();
  const heroSlot = slots[divisionHeroSlotKey(division.slug)];
  const teamSlot = slots[divisionTeamSlotKey(division.slug)];
  return (
    <>
      <ServiceJsonLd division={division} />
      <ServicePageViewTracker page={division.slug} />
      <Breadcrumbs items={[{ label: division.shortName, href: `/${division.slug}` }]} />
      <PageHero
        eyebrow={heroEyebrowOverride ?? division.shortName}
        title={heroHeadlineOverride ?? division.heroTitle}
        support={heroBodyOverride ?? division.heroSupport}
      >
        <CTAButtons quoteLabel={division.ctaLabel} />
      </PageHero>

      <section className="section grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl text-espresso-700">
            {categoriesHeadingOverride ?? division.categoriesLabel}
          </h2>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <CmsImage slot={heroSlot} nearbyHeading={division.categoriesLabel} className="aspect-[4/3]" />
      </section>

      <section className="bg-ivory-200">
        <div className="section">
          <h2 className="font-serif text-2xl text-espresso-700">{servicesHeadingOverride ?? "Services"}</h2>
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
        <CmsImage slot={teamSlot} className="aspect-[4/3] order-2 lg:order-1" />
        <div className="order-1 lg:order-2">
          <h2 className="font-serif text-2xl text-espresso-700">
            {experienceHeadingOverride ?? "The Moira Events Experience"}
          </h2>
          <p className="mt-4 text-lg italic text-espresso-600">
            &ldquo;{experienceTaglineOverride ?? differentiator}&rdquo;
          </p>
          <p className="mt-4 text-sm text-ink-muted">
            {experienceBodyOverride ??
              "Our team handles planning, vendor coordination, and on-the-day logistics so you can focus on experiencing your event, not managing it."}
          </p>
        </div>
      </section>

      {beforeCta}

      <section className="border-t border-espresso-100 bg-espresso-600">
        <div className="section flex flex-col items-center gap-6 text-center">
          <h2 className="font-serif text-3xl text-ivory-100">{ctaHeadingOverride ?? "Ready to Start Planning?"}</h2>
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
