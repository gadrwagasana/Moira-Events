import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ContactLeadForm } from "@/components/ContactLeadForm";
import { TrackedLink } from "@/components/TrackedLink";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { siteConfig } from "@/lib/content/config";
import { getSiteSettings } from "@/lib/settings/data";
import { formatE164Phone } from "@/lib/settings/format";
import { getSiteCopy } from "@/lib/site-copy/data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Moira Events via email, phone, WhatsApp, or our contact form.",
  alternates: { canonical: "/contact" },
};

// TODO (next pass): the Faq collection (lib/settings's sibling Faq model,
// migration applied, admin UI not yet built) is meant to replace this
// hardcoded list per the ticket's item 5 — not done in this pass, which
// focused on Site Settings itself. Every answer here still only restates a
// fact already established elsewhere in this app — nothing new claimed.
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
    answer: `Moira Events is based in ${siteConfig.country} and plans weddings, parties & social events, and corporate events for clients there.`,
  },
];

export default async function ContactPage() {
  const [settings, copy] = await Promise.all([getSiteSettings(), getSiteCopy()]);

  return (
    <>
      <Breadcrumbs items={[{ label: "Contact", href: "/contact" }]} />
      <PageHero
        eyebrow={copy["contact.hero.eyebrow"] ?? "Get In Touch"}
        title={copy["contact.hero.headline"] ?? "Contact Moira Events"}
      />

      <section className="section grid gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          {settings.contactEmail && (
            <div>
              <h2 className="font-serif text-xl text-espresso-700">Email</h2>
              <TrackedLink
                eventName="email_contact_click"
                eventProps={{ location: "contact_page" }}
                href={`mailto:${settings.contactEmail}`}
                className="text-ink-muted hover:text-espresso-600"
              >
                {settings.contactEmail}
              </TrackedLink>
            </div>
          )}
          {settings.phoneE164 && (
            <div>
              <h2 className="font-serif text-xl text-espresso-700">Phone</h2>
              <a href={`tel:${settings.phoneE164}`} className="text-ink-muted hover:text-espresso-600">
                {formatE164Phone(settings.phoneE164)}
              </a>
            </div>
          )}
          {settings.whatsappNumber && (
            <div>
              <h2 className="font-serif text-xl text-espresso-700">WhatsApp</h2>
              <TrackedLink
                eventName="whatsapp_contact_click"
                eventProps={{ location: "contact_page" }}
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="text-ink-muted hover:text-espresso-600"
              >
                Chat with us on WhatsApp
              </TrackedLink>
            </div>
          )}
          <div>
            <h2 className="font-serif text-xl text-espresso-700">Location</h2>
            <p className="text-ink-muted">
              {settings.addressLine && <>{settings.addressLine}, </>}
              {settings.city || siteConfig.country}
            </p>
            {settings.openingHours && <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{settings.openingHours}</p>}
            {settings.googleMapsUrl && (
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm text-espresso-600 hover:underline"
              >
                View on Google Maps
              </a>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-5 font-serif text-xl text-espresso-700">{copy["contact.form.heading"] ?? "Send a Message"}</h2>
          <ContactLeadForm />
        </div>
      </section>

      <section className="bg-ivory-200">
        <div className="section max-w-2xl">
          <h2 className="mb-6 font-serif text-2xl text-espresso-700">{copy["contact.faq.heading"] ?? "Frequently Asked Questions"}</h2>
          <Faq items={faqItems} />
        </div>
      </section>
    </>
  );
}
