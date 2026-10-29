import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ValuesGrid } from "@/components/ValuesGrid";
import { CmsImage } from "@/components/CmsImage";
import { CTAButtons } from "@/components/CTAButtons";
import { companyDescription, mission, vision, futureDirection, knownFor } from "@/lib/content/company";
import { getAllSiteImageSlots } from "@/lib/site-images/data";
import { getSiteCopy } from "@/lib/site-copy/data";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Moira Events — the team behind Rwanda's weddings, parties, and corporate events, and the mission, values, and process that shape every celebration we plan.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [slots, copy] = await Promise.all([getAllSiteImageSlots(), getSiteCopy()]);

  return (
    <>
      <PageHero
        eyebrow={copy["about.hero.eyebrow"] ?? "About Moira Events"}
        title={copy["about.hero.headline"] ?? knownFor}
      />

      <section className="section grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-4 text-ink/80">
          <p>{copy["about.intro.paragraph1"] ?? companyDescription.paragraphs[0]}</p>
          <p>{copy["about.intro.paragraph2"] ?? companyDescription.paragraphs[1]}</p>
        </div>
        <CmsImage slot={slots["about-team"]} className="aspect-[4/3] w-full rounded-xl" />
      </section>

      <section className="bg-ivory-200">
        <div className="section grid gap-10 md:grid-cols-2">
          <div className="rounded-xl bg-ivory-50 p-8">
            <h2 className="font-serif text-2xl text-espresso-700">{copy["about.mission.heading"] ?? "Mission"}</h2>
            <p className="mt-4 text-sm text-ink-muted">{copy["about.mission.body"] ?? mission}</p>
          </div>
          <div className="rounded-xl bg-ivory-50 p-8">
            <h2 className="font-serif text-2xl text-espresso-700">{copy["about.vision.heading"] ?? "Vision"}</h2>
            <p className="mt-4 text-sm text-ink-muted">{copy["about.vision.body"] ?? vision}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mb-12 text-center">
          <p className="label-eyebrow mb-3">{copy["about.values.eyebrow"] ?? "Our Values"}</p>
          <h2 className="font-serif text-3xl text-espresso-700">{copy["about.values.heading"] ?? "What Guides Us"}</h2>
        </div>
        <ValuesGrid />
      </section>

      <section className="bg-ivory-200">
        <div className="section">
          <h2 className="font-serif text-2xl text-espresso-700">
            {copy["about.future.heading"] ?? "Where We’re Headed"}
          </h2>
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
        <h2 className="font-serif text-2xl text-espresso-700">
          {copy["about.cta.heading"] ?? "Let’s Plan Your Event Together"}
        </h2>
        <CTAButtons className="mt-6 justify-center" />
      </section>
    </>
  );
}
