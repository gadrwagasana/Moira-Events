import type { Metadata } from "next";
import Link from "next/link";
import { CTAButtons } from "@/components/CTAButtons";
import { Logo } from "@/components/Logo";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { ValuesGrid } from "@/components/ValuesGrid";
import { ProcessSteps } from "@/components/ProcessSteps";
import { DivisionCard } from "@/components/DivisionCard";
import { divisions } from "@/lib/content/divisions";
import { companyDescription, knownFor, differentiator } from "@/lib/content/company";

export const metadata: Metadata = {
  description:
    "Moira Events plans weddings, parties & social events, and corporate events in Rwanda — full-service planning and coordination from first conversation to final toast.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-espresso-100 bg-gradient-to-b from-ivory-200 to-ivory-100">
        <div className="section grid items-center gap-12 pb-16 pt-16 md:pt-24 lg:grid-cols-2">
          <div>
            <p className="label-eyebrow mb-5">Weddings · Parties · Corporate Events in Rwanda</p>
            <h1 className="max-w-xl font-serif text-4xl leading-tight text-espresso-700 md:text-5xl lg:text-6xl">
              {knownFor}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink/70">{companyDescription.oneLiner}</p>
            <p className="mt-4 max-w-xl text-sm text-ink/60">
              Ready to get started? Request a quote for pricing, or book a free consultation if you&rsquo;d like to
              talk through your vision first.
            </p>
            <CTAButtons className="mt-6" />
          </div>
          <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-espresso-100 bg-gradient-to-br from-ivory-200 via-ivory-100 to-espresso-50 p-12 shadow-sm">
            <Logo className="h-auto w-full max-w-xs" />
          </div>
        </div>
      </section>

      {/* Three core services */}
      <section className="section">
        <div className="mb-12 text-center">
          <p className="label-eyebrow mb-3">What We Do</p>
          <h2 className="font-serif text-3xl text-espresso-700 md:text-4xl">Three Ways We Help You Celebrate</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {divisions.map((division) => (
            <DivisionCard key={division.slug} division={division} />
          ))}
        </div>
      </section>

      {/* Why Moira Events */}
      <section className="bg-ivory-200">
        <div className="section grid items-center gap-12 lg:grid-cols-2">
          <PlaceholderImage label="Why Moira Events" className="aspect-[4/3]" />
          <div>
            <p className="label-eyebrow mb-3">Why Moira Events</p>
            <h2 className="font-serif text-3xl text-espresso-700 md:text-4xl">
              We Take the Stress Out of Event Planning
            </h2>
            <p className="mt-5 text-lg italic text-espresso-600">&ldquo;{differentiator}&rdquo;</p>
            <ul className="mt-6 grid grid-cols-1 gap-3 text-sm text-ink/70 sm:grid-cols-2">
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
        <div className="mb-12 text-center">
          <p className="label-eyebrow mb-3">Our Values</p>
          <h2 className="font-serif text-3xl text-espresso-700 md:text-4xl">What Guides Every Event We Plan</h2>
        </div>
        <ValuesGrid />
      </section>

      {/* How it works teaser */}
      <section className="bg-ivory-200">
        <div className="section">
          <div className="mb-12 text-center">
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

      {/* Our Work */}
      <section className="section text-center">
        <p className="label-eyebrow mb-3">Our Work</p>
        <h2 className="sr-only">Our Work</h2>
        <p className="mx-auto max-w-xl text-lg text-ink/70">
          Every event is shaped around your vision, your guests, and the moments that matter most.
        </p>
        <div className="mt-8">
          <Link href="/portfolio" className="btn-secondary">
            View Portfolio
          </Link>
        </div>
      </section>

      {/* Final CTA */}
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
