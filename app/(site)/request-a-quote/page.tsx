import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { GeneralEnquiryForm } from "@/components/enquiries/GeneralEnquiryForm";
import { getServiceOptions } from "@/lib/enquiries/data";
import { getSiteCopy } from "@/lib/site-copy/data";

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
  const copy = await getSiteCopy();

  // The service catalogue is a nice-to-have on this form, not a hard
  // requirement — GeneralEnquiryForm already handles an empty services[]
  // array (no service checkboxes rendered, "Other" free-text still works).
  // A transient database error here (observed in production, not locally —
  // most likely a Neon/serverless connection issue, see SETUP.md) must
  // never take down the whole quote form with it; that's a core conversion
  // path, not a page that can afford to 500. Caught and degraded instead of
  // left to throw into a Server Component render, which is what produced
  // the blank "This page couldn't load" previously (no error.tsx existed
  // for this route either — see error.tsx, added alongside this fix).
  let partyServices: Awaited<ReturnType<typeof getServiceOptions>> = [];
  let corporateServices: Awaited<ReturnType<typeof getServiceOptions>> = [];
  try {
    [partyServices, corporateServices] = await Promise.all([
      getServiceOptions("PARTY"),
      getServiceOptions("CORPORATE"),
    ]);
  } catch (err) {
    console.error("[request-a-quote] failed to load service catalogue, rendering form without it:", err);
  }

  return (
    <>
      <PageHero
        eyebrow={copy["quote.hero.eyebrow"] ?? "Let's Get Started"}
        title={copy["quote.hero.headline"] ?? "Request a Quote"}
        support={
          copy["quote.hero.body"] ??
          "Share your event details and the Moira Events team will prepare a custom quote tailored to your vision and budget."
        }
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
