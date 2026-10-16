import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ProcessSteps } from "@/components/ProcessSteps";

export const metadata: Metadata = {
  title: "How It Works",
  description: "What happens after you contact Moira Events — from first conversation to the final toast.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Process"
        title="What Happens After You Contact Us?"
        support="A clear, guided process from first conversation to event day — recommended structure, refined as we grow."
      />

      <section className="section">
        <ProcessSteps />
      </section>

      <section className="border-t border-espresso-100 bg-espresso-600">
        <div className="section flex flex-col items-center gap-6 text-center">
          <h2 className="font-serif text-3xl text-ivory-100">Ready for Step One?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/request-a-quote" className="btn bg-ivory-100 text-espresso-700 hover:bg-ivory-200">
              Request a Quote
            </a>
            <a href="/book-a-consultation" className="btn border border-ivory-100 text-ivory-100 hover:bg-espresso-700">
              Book a Consultation
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
