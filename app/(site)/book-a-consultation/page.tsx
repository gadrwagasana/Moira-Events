import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ConsultationRequestForm } from "@/components/ConsultationRequestForm";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description: "Book a consultation with the Moira Events team to discuss your wedding, party or corporate event.",
  alternates: { canonical: "/book-a-consultation" },
};

export default function BookAConsultationPage() {
  return (
    <>
      <PageHero
        eyebrow="Let's Talk"
        title="Book a Consultation"
        support="Tell us a little about your event and preferred timing — our team will confirm a consultation that works for you."
      />
      <section className="section max-w-2xl">
        <ConsultationRequestForm />
      </section>
    </>
  );
}
