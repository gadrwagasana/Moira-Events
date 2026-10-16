import type { Metadata } from "next";
import { DivisionPageTemplate } from "@/components/DivisionPageTemplate";
import { divisions, targetCorporateClients } from "@/lib/content/divisions";

export const metadata: Metadata = {
  title: "Corporate Events",
  description:
    "Conferences, networking events and corporate functions planned for private companies, international organizations and NGOs by Moira Events.",
  alternates: { canonical: "/corporate-events" },
};

const division = divisions.find((d) => d.slug === "corporate-events")!;

export default function CorporateEventsPage() {
  return (
    <DivisionPageTemplate
      division={division}
      beforeCta={
        <section className="section">
          <h2 className="text-center font-serif text-2xl text-espresso-700">Who We Work With</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {targetCorporateClients.map((client) => (
              <span
                key={client}
                className="rounded-full border border-espresso-200 bg-ivory-50 px-5 py-2 text-sm text-ink/80"
              >
                {client}
              </span>
            ))}
          </div>
        </section>
      }
    />
  );
}
