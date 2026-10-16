import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { GeneralEnquiryForm } from "@/components/enquiries/GeneralEnquiryForm";
import { getServiceOptions } from "@/lib/enquiries/data";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Tell Moira Events about your party or corporate event and receive a custom quote.",
  // Always the bare path, regardless of the ?type= variant actually
  // requested — collapses /request-a-quote, ?type=party, ?type=corporate
  // (and any other value) into one canonical, indexed URL rather than
  // leaving them as duplicate-content variants with identical metadata.
  alternates: { canonical: "/request-a-quote" },
};

export const dynamic = "force-dynamic";

const typeMap: Record<string, "PARTY" | "CORPORATE" | "GENERAL"> = {
  party: "PARTY",
  corporate: "CORPORATE",
};

export default async function RequestAQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const defaultDivision = (params.type && typeMap[params.type]) || "GENERAL";

  const [partyServices, corporateServices] = await Promise.all([
    getServiceOptions("PARTY"),
    getServiceOptions("CORPORATE"),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Let's Get Started"
        title="Request a Quote"
        support="Share your event details and the Moira Events team will prepare a custom quote tailored to your vision and budget."
      />
      <section className="section max-w-2xl">
        <GeneralEnquiryForm
          defaultDivision={defaultDivision}
          partyServices={partyServices}
          corporateServices={corporateServices}
        />
      </section>
    </>
  );
}
