import Link from "next/link";
import { Logo } from "./Logo";
import { CTAButtons } from "./CTAButtons";
import { TrackedLink } from "./TrackedLink";
import { footerQuickLinks } from "@/lib/content/nav";
import { siteConfig } from "@/lib/content/config";
import { getSiteSettings } from "@/lib/settings/data";
import { formatE164Phone } from "@/lib/settings/format";

const footerLinkClass = "inline-block py-2.5 text-sm text-ink-muted hover:text-espresso-600 focus-ring rounded";

export async function Footer({ showCta = true }: { showCta?: boolean }) {
  const settings = await getSiteSettings();

  return (
    <footer className="border-t border-espresso-200 bg-ivory-400">
      {/* showCta=false on pages that already end in their own equivalent
          CTA band (homepage, division pages, weddings, services, portfolio)
          — avoids two near-identical "let's get started" bands back to back. */}
      {showCta && (
        <div className="border-b border-espresso-200 bg-ivory-300">
          <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-6 py-10 text-center">
            <h2 className="font-serif text-2xl text-espresso-700">Ready to Plan Your Event?</h2>
            <CTAButtons />
          </div>
        </div>
      )}
      <div className="mx-auto grid max-w-content gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <Link href="/">
            <Logo className="h-16 w-auto" />
          </Link>
          <p className="mt-3 text-sm text-ink-muted">{siteConfig.tagline}</p>
        </div>

        <div>
          <h3 className="label-eyebrow mb-2">Quick Links</h3>
          <ul>
            {footerQuickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/portal/login" className={footerLinkClass}>
                Client Login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="label-eyebrow mb-2">Contact</h3>
          <ul>
            {settings.contactEmail && (
              <li>
                <TrackedLink
                  eventName="email_contact_click"
                  eventProps={{ location: "footer" }}
                  href={`mailto:${settings.contactEmail}`}
                  className={footerLinkClass}
                >
                  {settings.contactEmail}
                </TrackedLink>
              </li>
            )}
            {settings.phoneE164 && (
              <li>
                <a href={`tel:${settings.phoneE164}`} className={footerLinkClass}>
                  {formatE164Phone(settings.phoneE164)}
                </a>
              </li>
            )}
            {settings.whatsappNumber && (
              <li>
                <TrackedLink
                  eventName="whatsapp_contact_click"
                  eventProps={{ location: "footer" }}
                  href={`https://wa.me/${settings.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className={footerLinkClass}
                >
                  WhatsApp Us
                </TrackedLink>
              </li>
            )}
            {/* No dedicated "country" field exists on Site Settings (not in
                the Contact tab's spec — only phone/WhatsApp/email/address/
                city/hours/maps) — city (when an admin sets one) takes
                precedence; siteConfig.country ("Rwanda") is the confirmed,
                stable fallback otherwise, not a fabricated value. */}
            <li className="py-2.5 text-sm text-ink-muted">{settings.city || siteConfig.country}</li>
          </ul>
        </div>
      </div>

      {/* Staff Login moved out of the public footer — still reachable
          directly at /admin/login, just no longer surfaced to every
          visitor on every page. */}
      <div className="border-t border-espresso-200 px-6 py-5 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} {settings.siteName}. All rights reserved.
      </div>
    </footer>
  );
}
