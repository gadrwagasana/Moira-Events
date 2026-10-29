import type { Metadata } from "next";
import { DivisionPageTemplate } from "@/components/DivisionPageTemplate";
import { divisions } from "@/lib/content/divisions";
import { getSiteCopy } from "@/lib/site-copy/data";

export const metadata: Metadata = {
  title: "Parties & Social Events",
  description:
    "Birthdays, galas, anniversaries and private celebrations — planned and executed professionally by Moira Events.",
  alternates: { canonical: "/parties-social-events" },
};

const division = divisions.find((d) => d.slug === "parties-social-events")!;

export default async function PartiesSocialEventsPage() {
  const copy = await getSiteCopy();
  return (
    <DivisionPageTemplate
      division={division}
      heroEyebrowOverride={copy["parties.hero.eyebrow"]}
      heroHeadlineOverride={copy["parties.hero.headline"]}
      heroBodyOverride={copy["parties.hero.body"]}
      categoriesHeadingOverride={copy["parties.categories.heading"]}
      servicesHeadingOverride={copy["parties.services.heading"]}
      experienceHeadingOverride={copy["parties.experience.heading"]}
      experienceTaglineOverride={copy["parties.experience.tagline"]}
      experienceBodyOverride={copy["parties.experience.body"]}
      ctaHeadingOverride={copy["parties.cta.heading"]}
    />
  );
}
