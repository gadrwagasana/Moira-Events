import { knownFor, companyDescription, mission, vision, differentiator } from "@/lib/content/company";

// The fixed, hand-maintained list of editable text slots on existing,
// hand-built pages — the text analog of lib/site-images/slots.ts. Adding a
// new one means adding one entry here AND reading it at that exact spot in
// the page component — the two are not derived from each other, same as
// SITE_IMAGE_SLOTS.
//
// `default` is the single source of truth for "what this falls back to
// when no override is saved" — the Homepage hero's headline/body default
// to the existing shared lib/content/company.ts constants directly (never
// duplicated as separate literal strings, so they can't drift), while the
// eyebrow/button labels — which only ever existed as inline JSX strings,
// not named constants — are defined here instead, since this task is
// explicitly not allowed to modify lib/content/company.ts.
export const SITE_COPY_SLOTS = [
  {
    key: "home.hero.eyebrow",
    label: "Homepage Hero — Eyebrow",
    page: "Homepage",
    pageHref: "/",
    maxLength: 100,
    default: "Weddings · Parties · Corporate Events in Rwanda",
  },
  {
    key: "home.hero.headline",
    label: "Homepage Hero — Headline",
    page: "Homepage",
    pageHref: "/",
    maxLength: 300,
    default: knownFor,
  },
  {
    key: "home.hero.body",
    label: "Homepage Hero — Supporting Text",
    page: "Homepage",
    pageHref: "/",
    maxLength: 500,
    default: companyDescription.oneLiner,
  },
  {
    key: "home.hero.primaryCtaLabel",
    label: "Homepage Hero — Primary Button Label",
    page: "Homepage",
    pageHref: "/",
    maxLength: 50,
    default: "Request a Quote",
  },
  {
    key: "home.hero.secondaryCtaLabel",
    label: "Homepage Hero — Secondary Button Label",
    page: "Homepage",
    pageHref: "/",
    maxLength: 50,
    default: "Explore Our Work",
  },
  // About page — mirrors the Homepage hero's independently-keyed fallback
  // approach: about.hero.headline defaults to the same `knownFor` constant
  // the Homepage hero also defaults to, but the two keys are completely
  // independent rows — overriding one can never affect the other.
  {
    key: "about.hero.eyebrow",
    label: "About — Hero Eyebrow",
    page: "About",
    pageHref: "/about",
    maxLength: 100,
    default: "About Moira Events",
  },
  {
    key: "about.hero.headline",
    label: "About — Hero Headline",
    page: "About",
    pageHref: "/about",
    maxLength: 300,
    default: knownFor,
  },
  {
    key: "about.intro.paragraph1",
    label: "About — Introduction, Paragraph 1",
    page: "About",
    pageHref: "/about",
    maxLength: 600,
    default: companyDescription.paragraphs[0],
  },
  {
    key: "about.intro.paragraph2",
    label: "About — Introduction, Paragraph 2",
    page: "About",
    pageHref: "/about",
    maxLength: 600,
    default: companyDescription.paragraphs[1],
  },
  {
    key: "about.mission.heading",
    label: "About — Mission Heading",
    page: "About",
    pageHref: "/about",
    maxLength: 100,
    default: "Mission",
  },
  {
    key: "about.mission.body",
    label: "About — Mission Text",
    page: "About",
    pageHref: "/about",
    maxLength: 500,
    default: mission,
  },
  {
    key: "about.vision.heading",
    label: "About — Vision Heading",
    page: "About",
    pageHref: "/about",
    maxLength: 100,
    default: "Vision",
  },
  {
    key: "about.vision.body",
    label: "About — Vision Text",
    page: "About",
    pageHref: "/about",
    maxLength: 800,
    default: vision,
  },
  {
    key: "about.values.eyebrow",
    label: "About — Values Section Eyebrow",
    page: "About",
    pageHref: "/about",
    maxLength: 100,
    default: "Our Values",
  },
  {
    key: "about.values.heading",
    label: "About — Values Section Heading",
    page: "About",
    pageHref: "/about",
    maxLength: 100,
    default: "What Guides Us",
  },
  {
    key: "about.future.heading",
    label: "About — “Where We're Headed” Heading",
    page: "About",
    pageHref: "/about",
    maxLength: 100,
    default: "Where We’re Headed",
  },
  {
    key: "about.cta.heading",
    label: "About — Closing CTA Heading",
    page: "About",
    pageHref: "/about",
    maxLength: 150,
    default: "Let’s Plan Your Event Together",
  },
  // Services page — all six defaults are literals already inline in
  // app/(site)/services/page.tsx (none come from a shared constant file,
  // unlike Home/About's hero headline/body). division.ctaLabel is one
  // string reused for all three divisions' "Learn more →" links within
  // this page only — not shared with any other page or component.
  {
    key: "services.hero.eyebrow",
    label: "Services — Hero Eyebrow",
    page: "Services",
    pageHref: "/services",
    maxLength: 100,
    default: "What We Offer",
  },
  {
    key: "services.hero.headline",
    label: "Services — Hero Headline",
    page: "Services",
    pageHref: "/services",
    maxLength: 150,
    default: "Services",
  },
  {
    key: "services.hero.body",
    label: "Services — Hero Supporting Text",
    page: "Services",
    pageHref: "/services",
    maxLength: 400,
    default: "Browse everything Moira Events can provide, organized by division. Every event is different, so every quote is custom.",
  },
  {
    key: "services.division.ctaLabel",
    label: "Services — “Learn more” Label (all three divisions)",
    page: "Services",
    pageHref: "/services",
    maxLength: 50,
    default: "Learn more →",
  },
  {
    key: "services.pricing.heading",
    label: "Services — Pricing Heading",
    page: "Services",
    pageHref: "/services",
    maxLength: 100,
    default: "Pricing",
  },
  {
    key: "services.pricing.body",
    label: "Services — Pricing Text",
    page: "Services",
    pageHref: "/services",
    maxLength: 400,
    default:
      "Moira Events builds a custom quote for every event based on guest count, services required, venue, and design complexity. Packages and published pricing are coming soon.",
  },
  // Weddings page — a bespoke page (does not use DivisionPageTemplate), so
  // its hero text is a separate inline literal that only coincidentally
  // matches lib/content/divisions.ts's weddingsDivision.heroTitle/
  // heroSupport today; overriding it here cannot affect DivisionPageTemplate
  // (Parties/Corporate) or ServiceJsonLd's SEO output (which reads
  // division.name/summary, never heroTitle/heroSupport) — confirmed by
  // reading both files before adding these keys. experience.tagline mirrors
  // the knownFor pattern: an independent key defaulting to the shared
  // `differentiator` constant, never duplicating or modifying it.
  {
    key: "weddings.hero.eyebrow",
    label: "Weddings — Hero Eyebrow",
    page: "Weddings",
    pageHref: "/weddings",
    maxLength: 100,
    default: "Weddings",
  },
  {
    key: "weddings.hero.headline",
    label: "Weddings — Hero Headline",
    page: "Weddings",
    pageHref: "/weddings",
    maxLength: 150,
    default: "Wedding Planning, Without the Stress",
  },
  {
    key: "weddings.hero.body",
    label: "Weddings — Hero Supporting Text",
    page: "Weddings",
    pageHref: "/weddings",
    maxLength: 400,
    default: "Professional planning, trusted vendors, detailed coordination, and seamless execution — so you simply enjoy the moment.",
  },
  {
    key: "weddings.types.heading",
    label: "Weddings — Wedding Types Heading",
    page: "Weddings",
    pageHref: "/weddings",
    maxLength: 100,
    default: "Wedding Types",
  },
  {
    key: "weddings.services.heading",
    label: "Weddings — Services Heading",
    page: "Weddings",
    pageHref: "/weddings",
    maxLength: 100,
    default: "Services",
  },
  {
    key: "weddings.experience.heading",
    label: "Weddings — Experience Heading",
    page: "Weddings",
    pageHref: "/weddings",
    maxLength: 100,
    default: "The Moira Events Experience",
  },
  {
    key: "weddings.experience.tagline",
    label: "Weddings — Experience Tagline",
    page: "Weddings",
    pageHref: "/weddings",
    maxLength: 300,
    default: differentiator,
  },
  {
    key: "weddings.experience.body",
    label: "Weddings — Experience Text",
    page: "Weddings",
    pageHref: "/weddings",
    maxLength: 400,
    default:
      "Our team handles planning, vendor coordination, and on-the-day logistics so you can focus on experiencing your wedding, not managing it.",
  },
  {
    key: "weddings.enquiry.heading",
    label: "Weddings — Enquiry Form Heading",
    page: "Weddings",
    pageHref: "/weddings",
    maxLength: 100,
    default: "Request a Wedding Quote",
  },
  {
    key: "weddings.enquiry.body",
    label: "Weddings — Enquiry Form Intro",
    page: "Weddings",
    pageHref: "/weddings",
    maxLength: 400,
    default:
      "Tell us about your wedding and the Moira Events team will prepare a custom quote tailored to your vision and budget.",
  },
  // Parties & Social Events page — unlike every page above, this page's
  // text lives entirely in the shared components/DivisionPageTemplate.tsx
  // (also used by Corporate), not in its own page.tsx. These defaults are
  // copied from the Parties division's current values in
  // lib/content/divisions.ts (confirmed against source before adding this)
  // — the override keys are independent rows, never a live reference, same
  // as every prior page's hero-text pattern. The template itself gains
  // optional override props; Corporate's page.tsx passes none of them, so
  // it is architecturally incapable of picking up a parties.* value.
  {
    key: "parties.hero.eyebrow",
    label: "Parties — Hero Eyebrow",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    maxLength: 100,
    default: "Parties & Social Events",
  },
  {
    key: "parties.hero.headline",
    label: "Parties — Hero Headline",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    maxLength: 150,
    default: "Celebrations, Planned to Perfection",
  },
  {
    key: "parties.hero.body",
    label: "Parties — Hero Supporting Text",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    maxLength: 400,
    default:
      "From birthdays to gala events, Moira Events brings the same precision and care to every personal celebration.",
  },
  {
    key: "parties.categories.heading",
    label: "Parties — Categories Heading",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    maxLength: 100,
    default: "Event Types",
  },
  {
    key: "parties.services.heading",
    label: "Parties — Services Heading",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    maxLength: 100,
    default: "Services",
  },
  {
    key: "parties.experience.heading",
    label: "Parties — Experience Heading",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    maxLength: 100,
    default: "The Moira Events Experience",
  },
  {
    key: "parties.experience.tagline",
    label: "Parties — Experience Tagline",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    maxLength: 300,
    default: differentiator,
  },
  {
    key: "parties.experience.body",
    label: "Parties — Experience Text",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    maxLength: 400,
    default:
      "Our team handles planning, vendor coordination, and on-the-day logistics so you can focus on experiencing your event, not managing it.",
  },
  {
    key: "parties.cta.heading",
    label: "Parties — Closing CTA Heading",
    page: "Parties & Social Events",
    pageHref: "/parties-social-events",
    maxLength: 100,
    default: "Ready to Start Planning?",
  },
  // Corporate Events page — reuses the exact same DivisionPageTemplate
  // optional props Parties already wired in; no template change needed
  // this time. corporate.clients.heading is the one field that lives
  // entirely in app/(site)/corporate-events/page.tsx itself (the "Who We
  // Work With" section, passed to the template as a beforeCta node), not
  // in the shared template at all.
  {
    key: "corporate.hero.eyebrow",
    label: "Corporate — Hero Eyebrow",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    maxLength: 100,
    default: "Corporate Events",
  },
  {
    key: "corporate.hero.headline",
    label: "Corporate — Hero Headline",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    maxLength: 150,
    default: "Corporate Events, Executed Professionally",
  },
  {
    key: "corporate.hero.body",
    label: "Corporate — Hero Supporting Text",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    maxLength: 400,
    default:
      "Conferences, networking events, and company functions — planned and run with the precision your organization expects.",
  },
  {
    key: "corporate.categories.heading",
    label: "Corporate — Categories Heading",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    maxLength: 100,
    default: "Event Types",
  },
  {
    key: "corporate.services.heading",
    label: "Corporate — Services Heading",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    maxLength: 100,
    default: "Services",
  },
  {
    key: "corporate.experience.heading",
    label: "Corporate — Experience Heading",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    maxLength: 100,
    default: "The Moira Events Experience",
  },
  {
    key: "corporate.experience.tagline",
    label: "Corporate — Experience Tagline",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    maxLength: 300,
    default: differentiator,
  },
  {
    key: "corporate.experience.body",
    label: "Corporate — Experience Text",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    maxLength: 400,
    default:
      "Our team handles planning, vendor coordination, and on-the-day logistics so you can focus on experiencing your event, not managing it.",
  },
  {
    key: "corporate.cta.heading",
    label: "Corporate — Closing CTA Heading",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    maxLength: 100,
    default: "Ready to Start Planning?",
  },
  {
    key: "corporate.clients.heading",
    label: "Corporate — \"Who We Work With\" Heading",
    page: "Corporate Events",
    pageHref: "/corporate-events",
    maxLength: 100,
    default: "Who We Work With",
  },
] as const;

export type SiteCopyKey = (typeof SITE_COPY_SLOTS)[number]["key"];

export const SITE_COPY_KEYS = SITE_COPY_SLOTS.map((s) => s.key) as SiteCopyKey[];

export function siteCopyDefault(key: SiteCopyKey): string {
  return SITE_COPY_SLOTS.find((s) => s.key === key)!.default;
}
