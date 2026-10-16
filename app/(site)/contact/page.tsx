import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ContactLeadForm } from "@/components/ContactLeadForm";
import { TrackedLink } from "@/components/TrackedLink";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { siteConfig } from "@/lib/content/config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Moira Events via email, phone, WhatsApp, or our contact form.",
  alternates: { canonical: "/contact" },
};

// Every answer here restates a fact already established elsewhere in this
// app (pricing/process copy on Services & How It Works, the live-scheduling
// caveat already shown on the consultation form, the confirmed service
// area) — nothing new is claimed here that isn't already true on the site.
const faqItems = [
  {
    question: "Do you have fixed packages or published pricing?",
    answer:
      "Not yet — every quote is built around your guest count, services, venue, and design complexity. Packages and published pricing are coming soon.",
  },
  {
    question: "What happens after I submit an enquiry or quote request?",
    answer:
      "Our team reviews your event requirements and contacts you to discuss next steps — you'll also receive a reference number to track your request.",
  },
  {
    question: "Can I book a consultation before committing to a quote?",
    answer:
      "Yes — use the Book a Consultation page to share your preferred timing. We'll confirm a time that works for both sides; live calendar booking is coming in a future update.",
  },
  {
    question: "Where is Moira Events based, and who do you work with?",
    answer:
      `Moira Events is based in ${siteConfig.country} and plans weddings, parties & social events, and corporate events for clients there.`,
  },
];

export default function ContactPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Contact", href: "/contact" }]} />
      <PageHero eyebrow="Get In Touch" title="Contact Moira Events" />

      <section className="section grid gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-xl text-espresso-700">Email</h2>
            <TrackedLink
              eventName="email_contact_click"
              eventProps={{ location: "contact_page" }}
              href={`mailto:${siteConfig.email}`}
              className="text-ink/70 hover:text-espresso-600"
            >
              {siteConfig.email}
            </TrackedLink>
          </div>
          <div>
            <h2 className="font-serif text-xl text-espresso-700">Phone</h2>
            <a href={`tel:${siteConfig.phone}`} className="text-ink/70 hover:text-espresso-600">
              {siteConfig.phone}
            </a>
          </div>
          <div>
            <h2 className="font-serif text-xl text-espresso-700">WhatsApp</h2>
            <TrackedLink
              eventName="whatsapp_contact_click"
              eventProps={{ location: "contact_page" }}
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="text-ink/70 hover:text-espresso-600"
            >
              Chat with us on WhatsApp
            </TrackedLink>
          </div>
          <div>
            <h2 className="font-serif text-xl text-espresso-700">Location</h2>
            <p className="text-ink/70">{siteConfig.country}</p>
          </div>
        </div>

        <div>
          <h2 className="mb-5 font-serif text-xl text-espresso-700">Send a Message</h2>
          <ContactLeadForm />
        </div>
      </section>

      <section className="bg-ivory-200">
        <div className="section max-w-2xl">
          <h2 className="mb-6 font-serif text-2xl text-espresso-700">Frequently Asked Questions</h2>
          <Faq items={faqItems} />
        </div>
      </section>
    </>
  );
}
