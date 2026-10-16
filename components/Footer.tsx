import Link from "next/link";
import { Logo } from "./Logo";
import { CTAButtons } from "./CTAButtons";
import { TrackedLink } from "./TrackedLink";
import { footerQuickLinks } from "@/lib/content/nav";
import { siteConfig } from "@/lib/content/config";

export function Footer() {
  return (
    <footer className="border-t border-espresso-200 bg-ivory-400">
      <div className="border-b border-espresso-200 bg-ivory-300">
        <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-6 py-10 text-center">
          <h2 className="font-serif text-2xl text-espresso-700">Ready to Plan Your Event?</h2>
          <CTAButtons />
        </div>
      </div>
      <div className="mx-auto grid max-w-content gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <Link href="/">
            <Logo className="h-16 w-auto" />
          </Link>
          <p className="mt-3 text-sm text-ink/70">{siteConfig.tagline}</p>
        </div>

        <div>
          <h3 className="label-eyebrow mb-4">Quick Links</h3>
          <ul className="space-y-2">
            {footerQuickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-ink/70 hover:text-espresso-600">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/portal/login" className="text-sm text-ink/70 hover:text-espresso-600">
                Client Login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="label-eyebrow mb-4">Contact</h3>
          <ul className="space-y-2 text-sm text-ink/70">
            <li>
              <TrackedLink
                eventName="email_contact_click"
                eventProps={{ location: "footer" }}
                href={`mailto:${siteConfig.email}`}
                className="hover:text-espresso-600"
              >
                {siteConfig.email}
              </TrackedLink>
            </li>
            <li>
              <a href={`tel:${siteConfig.phone}`} className="hover:text-espresso-600">
                {siteConfig.phone}
              </a>
            </li>
            <li>
              <TrackedLink
                eventName="whatsapp_contact_click"
                eventProps={{ location: "footer" }}
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-espresso-600"
              >
                WhatsApp Us
              </TrackedLink>
            </li>
            <li>{siteConfig.country}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-espresso-200 px-6 py-5 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} Moira Events. All rights reserved. ·{" "}
        <Link href="/admin/login" className="hover:text-espresso-600">
          Staff Login
        </Link>
      </div>
    </footer>
  );
}
