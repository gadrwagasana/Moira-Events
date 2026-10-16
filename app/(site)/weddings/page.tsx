import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { WeddingEnquiryForm } from "@/components/weddings/WeddingEnquiryForm";
import { ServiceJsonLd } from "@/components/ServiceJsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ServicePageViewTracker } from "@/components/ServicePageViewTracker";
import { getActiveWeddingTypes, getWeddingServiceCatalogue } from "@/lib/weddings/data";
import { differentiator } from "@/lib/content/company";
import { divisions } from "@/lib/content/divisions";

const weddingsDivision = divisions.find((d) => d.slug === "weddings")!;

export const metadata: Metadata = {
  title: "Wedding Planning",
  description:
    "Full-service wedding planning in Rwanda — traditional, large-scale and intimate weddings, planned and coordinated by Moira Events.",
  alternates: { canonical: "/weddings" },
};

export const dynamic = "force-dynamic";

export default async function WeddingsPage() {
  const [weddingTypes, { categories, uncategorized }] = await Promise.all([
    getActiveWeddingTypes(),
    getWeddingServiceCatalogue(),
  ]);

  return (
    <>
      <ServiceJsonLd division={weddingsDivision} />
      <ServicePageViewTracker page="weddings" />
      <Breadcrumbs items={[{ label: "Weddings", href: "/weddings" }]} />
      <PageHero
        eyebrow="Weddings"
        title="Wedding Planning, Without the Stress"
        support="Professional planning, trusted vendors, detailed coordination, and seamless execution — so you simply enjoy the moment."
      />

      <section className="section grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl text-espresso-700">Wedding Types</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {weddingTypes.map((wt) => (
              <li key={wt.id} className="rounded-lg border border-espresso-100 bg-ivory-50 px-4 py-3 text-sm text-ink/80">
                {wt.name}
                {wt.description && <p className="mt-1 text-xs text-ink/50">{wt.description}</p>}
              </li>
            ))}
          </ul>
        </div>
        <PlaceholderImage label="Weddings" />
      </section>

      <section className="bg-ivory-200">
        <div className="section">
          <h2 className="font-serif text-2xl text-espresso-700">Services</h2>
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
        <PlaceholderImage label="Wedding Experience" className="order-2 lg:order-1" />
        <div className="order-1 lg:order-2">
          <h2 className="font-serif text-2xl text-espresso-700">The Moira Events Experience</h2>
          <p className="mt-4 text-lg italic text-espresso-600">&ldquo;{differentiator}&rdquo;</p>
          <p className="mt-4 text-sm text-ink/70">
            Our team handles planning, vendor coordination, and on-the-day logistics so you can focus on
            experiencing your wedding, not managing it.
          </p>
        </div>
      </section>

      <section className="border-t border-espresso-100 bg-ivory-200">
        <div className="section max-w-2xl">
          <h2 className="mb-2 font-serif text-2xl text-espresso-700">Request a Wedding Quote</h2>
          <p className="mb-8 text-sm text-ink/70">
            Tell us about your wedding and the Moira Events team will prepare a custom quote tailored to your
            vision and budget.
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
