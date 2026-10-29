import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CmsImage } from "@/components/CmsImage";
import { WeddingEnquiryForm } from "@/components/weddings/WeddingEnquiryForm";
import { ServiceJsonLd } from "@/components/ServiceJsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ServicePageViewTracker } from "@/components/ServicePageViewTracker";
import { getActiveWeddingTypes, getWeddingServiceCatalogue } from "@/lib/weddings/data";
import { differentiator } from "@/lib/content/company";
import { divisions } from "@/lib/content/divisions";
import { getAllSiteImageSlots } from "@/lib/site-images/data";
import { divisionHeroSlotKey, divisionTeamSlotKey } from "@/lib/site-images/slots";
import { getSiteCopy } from "@/lib/site-copy/data";

const weddingsDivision = divisions.find((d) => d.slug === "weddings")!;

export const metadata: Metadata = {
  title: "Wedding Planning",
  description:
    "Full-service wedding planning in Rwanda — traditional, large-scale and intimate weddings, planned and coordinated by Moira Events.",
  alternates: { canonical: "/weddings" },
};

export const dynamic = "force-dynamic";

export default async function WeddingsPage() {
  const [weddingTypes, { categories, uncategorized }, slots, copy] = await Promise.all([
    getActiveWeddingTypes(),
    getWeddingServiceCatalogue(),
    getAllSiteImageSlots(),
    getSiteCopy(),
  ]);
  const heroSlot = slots[divisionHeroSlotKey(weddingsDivision.slug)];
  const teamSlot = slots[divisionTeamSlotKey(weddingsDivision.slug)];

  return (
    <>
      <ServiceJsonLd division={weddingsDivision} />
      <ServicePageViewTracker page="weddings" />
      <Breadcrumbs items={[{ label: "Weddings", href: "/weddings" }]} />
      <PageHero
        eyebrow={copy["weddings.hero.eyebrow"] ?? "Weddings"}
        title={copy["weddings.hero.headline"] ?? "Wedding Planning, Without the Stress"}
        support={
          copy["weddings.hero.body"] ??
          "Professional planning, trusted vendors, detailed coordination, and seamless execution — so you simply enjoy the moment."
        }
      />

      <section className="section grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl text-espresso-700">{copy["weddings.types.heading"] ?? "Wedding Types"}</h2>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {weddingTypes.map((wt) => (
              <li key={wt.id} className="rounded-lg border border-espresso-100 bg-ivory-50 px-4 py-3 text-sm text-ink/80">
                {wt.name}
                {wt.description && <p className="mt-1 text-xs text-ink-muted">{wt.description}</p>}
              </li>
            ))}
          </ul>
        </div>
        <CmsImage slot={heroSlot} nearbyHeading="Wedding Types" className="aspect-[4/3]" />
      </section>

      <section className="bg-ivory-200">
        <div className="section">
          <h2 className="font-serif text-2xl text-espresso-700">{copy["weddings.services.heading"] ?? "Services"}</h2>
          <div className="mt-5 space-y-6">
            {categories.map((cat) => (
              <div key={cat.id}>
                <h3 className="mb-2 text-sm font-semibold text-espresso-600">{cat.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {cat.services.map((svc) => (
                    <span
                      key={svc.id}
                      className="rounded-full border border-espresso-200 bg-ivory-50 px-4 py-1.5 text-sm text-ink/80"
                    >
                      {svc.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {uncategorized.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {uncategorized.map((svc) => (
                  <span
                    key={svc.id}
                    className="rounded-full border border-espresso-200 bg-ivory-50 px-4 py-1.5 text-sm text-ink/80"
                  >
                    {svc.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section grid items-center gap-12 lg:grid-cols-2">
        <CmsImage slot={teamSlot} className="aspect-[4/3] order-2 lg:order-1" />
        <div className="order-1 lg:order-2">
          <h2 className="font-serif text-2xl text-espresso-700">
            {copy["weddings.experience.heading"] ?? "The Moira Events Experience"}
          </h2>
          <p className="mt-4 text-lg font-medium text-espresso-600">
            {copy["weddings.experience.tagline"] ?? differentiator}
          </p>
          <p className="mt-4 text-sm text-ink-muted">
            {copy["weddings.experience.body"] ??
              "Our team handles planning, vendor coordination, and on-the-day logistics so you can focus on experiencing your wedding, not managing it."}
          </p>
        </div>
      </section>

      <section id="enquiry-form" className="scroll-mt-20 border-t border-espresso-100 bg-ivory-200">
        <div className="section max-w-2xl">
          <h2 className="mb-2 font-serif text-2xl text-espresso-700">
            {copy["weddings.enquiry.heading"] ?? "Request a Wedding Quote"}
          </h2>
          <p className="mb-8 text-sm text-ink-muted">
            {copy["weddings.enquiry.body"] ??
              "Tell us about your wedding and the Moira Events team will prepare a custom quote tailored to your vision and budget."}
          </p>
          <WeddingEnquiryForm
            weddingTypes={weddingTypes}
            categories={categories}
            uncategorizedServices={uncategorized}
          />
        </div>
      </section>
    </>
  );
}
