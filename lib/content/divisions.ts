export type Division = {
  slug: "weddings" | "parties-social-events" | "corporate-events";
  name: string;
  shortName: string;
  // Division images are CMS-managed slots now (lib/site-images), keyed off
  // this slug via divisionHeroSlotKey/divisionTeamSlotKey — not stored here.
  heroTitle: string;
  heroSupport: string;
  summary: string;
  categories: string[];
  categoriesLabel: string;
  services: string[];
  // Internal business-priority note (revenue/growth framing) — never
  // rendered on a public page (Stage P audit: this used to leak onto
  // DivisionPageTemplate as visible copy). Kept for potential internal/admin
  // use only.
  importance: string;
  ctaLabel: string;
  ctaHref: string;
};

export const divisions: Division[] = [
  {
    slug: "weddings",
    name: "Wedding Planning",
    shortName: "Weddings",
    heroTitle: "Wedding Planning, Without the Stress",
    heroSupport:
      "Professional planning, trusted vendors, detailed coordination, and seamless execution — so you simply enjoy the moment.",
    summary:
      "Weddings are Moira Events' signature service — from traditional ceremonies to large-scale celebrations, the team manages every detail from first conversation to final dance.",
    categoriesLabel: "Wedding Types",
    categories: ["Traditional Weddings", "Large-Scale Weddings", "Intimate Weddings", "Other Wedding Types"],
    services: [
      "Full Wedding Planning",
      "Partial Planning",
      "Day-of Coordination",
      "Destination Weddings",
      "Design/Concept",
      "Venue Sourcing",
      "Budget Management",
      "Vendor Management",
      "Décor",
      "Catering Coordination",
      "Photography",
      "Videography",
      "Entertainment",
      "Transportation",
      "Guest Management",
      "Invitations/Stationery",
      "Wedding Cake",
      "Honeymoon/Travel Coordination",
    ],
    importance: "Very important — currently the top revenue driver for Moira Events.",
    ctaLabel: "Request a Wedding Quote",
    ctaHref: "/request-a-quote?type=wedding",
  },
  {
    slug: "parties-social-events",
    name: "Parties & Social Events",
    shortName: "Parties & Social Events",
    heroTitle: "Celebrations, Planned to Perfection",
    heroSupport:
      "From birthdays to gala events, Moira Events brings the same precision and care to every personal celebration.",
    summary:
      "Moira Events plans the full range of personal and social celebrations — handling design, vendors, and logistics so hosts can enjoy their own event.",
    categoriesLabel: "Event Types",
    categories: [
      "Birthdays",
      "Anniversaries",
      "Engagement Parties",
      "Bridal Showers",
      "Baby Showers",
      "Graduation Celebrations",
      "Private Dinners",
      "Family Celebrations",
      "Children's Events",
      "Cultural Celebrations",
      "Gala Events",
    ],
    services: [
      "Event Planning",
      "Event Design",
      "Venue Sourcing",
      "Décor",
      "Catering",
      "Entertainment",
      "DJ",
      "Live Music",
      "Photography",
      "Videography",
      "Lighting",
      "Sound",
      "Furniture",
      "Tents",
      "Transportation",
      "Guest Management",
    ],
    importance:
      "Very important. Birthdays are currently the most commercially active service; Gala Events are the identified growth priority.",
    ctaLabel: "Request a Quote",
    ctaHref: "/request-a-quote?type=party",
  },
  {
    slug: "corporate-events",
    name: "Corporate Events",
    shortName: "Corporate Events",
    heroTitle: "Corporate Events, Executed Professionally",
    heroSupport:
      "Conferences, networking events, and company functions — planned and run with the precision your organization expects.",
    summary:
      "Moira Events plans corporate events for private companies, international organizations, and NGOs — conferences, networking events, and company functions run with the precision your organization expects.",
    categoriesLabel: "Event Types",
    categories: ["Conferences", "Networking Events", "Other Corporate Events"],
    services: [
      "Event Planning",
      "Venue Sourcing",
      "Event Design",
      "Décor",
      "Catering",
      "AV Production",
      "Stage Design",
      "Photography",
      "Videography",
      "Entertainment",
      "Guest Registration",
      "Transportation",
      "Accommodation",
      "Branding/Signage",
      "Event Staffing",
    ],
    importance: "Identified as the strongest growth priority for Moira Events' future.",
    ctaLabel: "Request a Corporate Event Proposal",
    ctaHref: "/request-a-quote?type=corporate",
  },
];

export const targetCorporateClients = ["Private Companies", "International Organizations", "NGOs"];
