import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CTAButtons } from "@/components/CTAButtons";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "A look at the events Moira Events plans across weddings, parties & social events, and corporate events.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <>
      <PageHero eyebrow="Our Work" title="Portfolio" />
      <section className="section max-w-2xl text-center">
        <p className="text-lg text-ink/70">
          Every event is shaped around your vision, your guests, and the moments that matter most.
        </p>
        <CTAButtons className="mt-8 justify-center" />
      </section>
    </>
  );
}
