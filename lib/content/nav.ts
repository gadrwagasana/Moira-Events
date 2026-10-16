export type NavLink = {
  label: string;
  href: string;
};

export type NavItem = NavLink & { children?: NavLink[] };

const ourEventsLinks: NavLink[] = [
  { label: "Weddings", href: "/weddings" },
  { label: "Parties & Social Events", href: "/parties-social-events" },
  { label: "Corporate Events", href: "/corporate-events" },
];

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Our Events", href: "/weddings", children: ourEventsLinks },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "About", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contact", href: "/contact" },
];

export const footerQuickLinks: NavLink[] = [
  { label: "Home", href: "/" },
  ...ourEventsLinks,
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "About", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Book a Consultation", href: "/book-a-consultation" },
  { label: "Contact", href: "/contact" },
];
