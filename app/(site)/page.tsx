import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CmsImage } from "@/components/CmsImage";
import { ValuesGrid } from "@/components/ValuesGrid";
import { ProcessSteps } from "@/components/ProcessSteps";
import { DivisionCard } from "@/components/DivisionCard";
import { divisions } from "@/lib/content/divisions";
import { companyDescription, knownFor, differentiator } from "@/lib/content/company";
import { getAllSiteImageSlots, listPublishedPortfolioItems } from "@/lib/site-images/data";
import { divisionHeroSlotKey } from "@/lib/site-images/slots";
import { getSiteCopy } from "@/lib/site-copy/data";

export const metadata: Metadata = {
  description:
    "Moira Events plans weddings, parties & social events, and corporate events in Rwanda — full-service planning and coordination from first conversation to final toast.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [slots, recentWork, copy] = await Promise.all([
    getAllSiteImageSlots(),
    listPublishedPortfolioItems().then((items) => items.slice(0, 3)),
    getSiteCopy(),
  ]);

  return (
    <>
      {/* Hero — full-bleed photo background with a dark scrim, content
          centered on top (image sourced from the same CMS "home-hero" slot
          as before; CmsImage's own placeholder/fallback still applies when
          no photo has been set yet in Admin → Site Images). */}
      <section className="relative isolate overflow-hidden border-b border-espresso-100">
        <CmsImage slot={slots["home-hero"]} priority className="absolute inset-0" />
        <div className="absolute inset-0 bg-espresso-900/60" />
        <div className="section relative py-24 text-center md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-ivory-200">
              {copy["home.hero.eyebrow"] ?? "Weddings · Parties · Corporate Events in Rwanda"}
            </p>
            <h1 className="font-serif text-4xl leading-tight text-ivory-50 md:text-5xl lg:text-6xl">
              {copy["home.hero.headline"] ?? knownFor}
            </h1>
            <p className="mt-6 text-lg text-ivory-100/90">{copy["home.hero.body"] ?? companyDescription.oneLiner}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/request-a-quote" className="btn-primary">
                {copy["home.hero.primaryCtaLabel"] ?? "Request a Quote"}
              </Link>
              <Link
                href="/portfolio"
                className="btn border border-ivory-100 text-ivory-50 hover:bg-ivory-100 hover:text-espresso-700"
              >
                {copy["home.hero.secondaryCtaLabel"] ?? "Explore Our Work"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three core services */}
      <section className="section">
        <div className="mb-10 text-center md:mb-12">
          <p className="label-eyebrow mb-3">What We Do</p>
          <h2 className="font-serif text-3xl text-espresso-700 md:text-4xl">Three Ways We Help You Celebrate</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {divisions.map((division) => (
            <DivisionCard
              key={division.slug}
              division={division}
              imageSlot={slots[divisionHeroSlotKey(division.slug)]}
            />
          ))}
        </div>
      </section>

      {/* Recent Work — reuses lib/site-images (PortfolioItem), the same CMS
          data model the /portfolio gallery itself is built on, rather than
          a separate homepage-only content source. Omitted entirely (not
          shown empty/placeholder) when nothing is published yet, matching
          the project's existing rule against fabricated or empty-box
          content — unlike the fixed, always-present image slots above,
          this is a variable-length list with nothing to show yet. */}
      {recentWork.length > 0 && (
        <section className="section">
          <div className="mb-10 text-center md:mb-12">
            <p className="label-eyebrow mb-3">Recent Work</p>
            <h2 className="font-serif text-3xl text-espresso-700 md:text-4xl">From Our Portfolio</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {recentWork.map((item) => (
              <Link
                key={item.id}
                href="/portfolio"
                className="card-interactive focus-ring group relative flex flex-col overflow-hidden rounded-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-ivory-200 to-espresso-100">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.alt || item.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
                    />
                  ) : (
                    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                      <Image
                        src="/images/moira-events-logo.png"
                        alt=""
                        width={1496}
                        height={706}
                        className="w-1/3 max-w-[140px] opacity-20"
                      />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg text-espresso-700">{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/portfolio" className="btn-secondary">
              See the Full Portfolio
            </Link>
          </div>
        </section>
      )}

      {/* Why Moira Events */}
      <section className="bg-ivory-200">
        <div className="section grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <CmsImage slot={slots["home-why-moira"]} className="aspect-[4/3] w-full rounded-xl" />
          <div>
            <p className="label-eyebrow mb-3">Why Moira Events</p>
            <h2 className="font-serif text-3xl text-espresso-700 md:text-4xl">
              We Take the Stress Out of Event Planning
            </h2>
            {/* Not attributed to a specific client (none has been confirmed)
                — presented as a brand statement, not styled as a quote. */}
            <p className="mt-5 text-lg font-medium text-espresso-600">{differentiator}</p>
            <ul className="mt-6 grid grid-cols-1 gap-3 text-sm text-ink-muted sm:grid-cols-2">
              {["Trusted vendors", "Smooth planning", "Seamless execution", "Attention to detail", "Professional coordination", "Stress-free experience"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-espresso-500" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="mb-10 text-center md:mb-12">
          <p className="label-eyebrow mb-3">Our Values</p>
          <h2 className="font-serif text-3xl text-espresso-700 md:text-4xl">What Guides Every Event We Plan</h2>
        </div>
        <ValuesGrid />
      </section>

      {/* How it works teaser */}
      <section className="bg-ivory-200">
        <div className="section">
          <div className="mb-10 text-center md:mb-12">
            <p className="label-eyebrow mb-3">How It Works</p>
            <h2 className="font-serif text-3xl text-espresso-700 md:text-4xl">From First Hello to the Final Toast</h2>
          </div>
          <ProcessSteps compact />
          <div className="mt-10 text-center">
            <Link href="/how-it-works" className="btn-secondary">
              See the Full Process
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA — Footer's own CTA band is suppressed on "/" (see
          components/SiteFooter.tsx) specifically so this doesn't duplicate it. */}
      <section className="border-t border-espresso-100 bg-espresso-600">
        <div className="section text-center">
          <h2 className="font-serif text-3xl text-ivory-100 md:text-4xl">
            Planning an Event? Let&rsquo;s Make It Seamless.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ivory-200">
            Whether it is a wedding, social celebration or corporate event, Moira Events can help turn the vision
            into a smoothly executed experience.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/request-a-quote" className="btn bg-ivory-100 text-espresso-700 hover:bg-ivory-200">
              Request a Quote
            </Link>
            <Link href="/book-a-consultation" className="btn border border-ivory-100 text-ivory-100 hover:bg-espresso-700">
              Book a Consultation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
