import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ConsultationRequestForm } from "@/components/ConsultationRequestForm";
import { getSiteCopy } from "@/lib/site-copy/data";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description: "Book a consultation with the Moira Events team to discuss your wedding, party or corporate event.",
  alternates: { canonical: "/book-a-consultation" },
};

export default async function BookAConsultationPage() {
  const copy = await getSiteCopy();

  return (
    <>
      <PageHero
        eyebrow={copy["consultation.hero.eyebrow"] ?? "Let's Talk"}
        title={copy["consultation.hero.headline"] ?? "Book a Consultation"}
        support={
          copy["consultation.hero.body"] ??
          "Tell us a little about your event and preferred timing — our team will confirm a consultation that works for you."
        }
      />
      <section className="section max-w-2xl">
        <ConsultationRequestForm />
      </section>
    </>
  );
}
