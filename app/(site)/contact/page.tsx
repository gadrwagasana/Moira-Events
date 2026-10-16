import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ContactLeadForm } from "@/components/ContactLeadForm";
import { TrackedLink } from "@/components/TrackedLink";
import { siteConfig } from "@/lib/content/config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Moira Events via email, phone, WhatsApp, or our contact form.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
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
    </>
  );
}
