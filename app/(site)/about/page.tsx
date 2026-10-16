import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ValuesGrid } from "@/components/ValuesGrid";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { CTAButtons } from "@/components/CTAButtons";
import { companyDescription, mission, vision, futureDirection, knownFor } from "@/lib/content/company";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Moira Events — the team behind Rwanda's weddings, parties, and corporate events, and the mission, values, and process that shape every celebration we plan.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About Moira Events" title={knownFor} />

      <section className="section grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-4 text-ink/80">
          {companyDescription.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <PlaceholderImage label="The Moira Events Team" />
      </section>

      <section className="bg-ivory-200">
        <div className="section grid gap-10 md:grid-cols-2">
          <div className="rounded-xl bg-ivory-50 p-8">
            <h2 className="font-serif text-2xl text-espresso-700">Mission</h2>
            <p className="mt-4 text-sm text-ink/70">{mission}</p>
          </div>
          <div className="rounded-xl bg-ivory-50 p-8">
            <h2 className="font-serif text-2xl text-espresso-700">Vision</h2>
            <p className="mt-4 text-sm text-ink/70">{vision}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mb-12 text-center">
          <p className="label-eyebrow mb-3">Our Values</p>
          <h2 className="font-serif text-3xl text-espresso-700">What Guides Us</h2>
        </div>
        <ValuesGrid />
      </section>

      <section className="bg-ivory-200">
        <div className="section">
          <h2 className="font-serif text-2xl text-espresso-700">Where We&rsquo;re Headed</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {futureDirection.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-lg bg-ivory-50 p-4 text-sm text-ink/80">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-espresso-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section text-center">
        <h2 className="font-serif text-2xl text-espresso-700">Let&rsquo;s Plan Your Event Together</h2>
        <CTAButtons className="mt-6 justify-center" />
      </section>
    </>
  );
}
