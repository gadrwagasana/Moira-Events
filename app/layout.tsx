import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const SITE_NAME = "Moira Events";
const DESCRIPTION =
  "Moira Events is a full-service event planning company turning ambitious visions into seamlessly executed, stress-free celebrations — weddings, parties & social events, and corporate events in Rwanda.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Moira Events | Weddings, Parties & Corporate Events",
    template: "%s | Moira Events",
  },
  description: DESCRIPTION,
  // Phase M SEO audit: no social-sharing preview existed at all before this
  // (confirmed — no openGraph/twitter block anywhere in the app). Uses the
  // real existing logo asset (public/images/moira-events-logo.png, already
  // used by components/Logo.tsx) as a baseline preview image — not a
  // fabricated asset — since no dedicated OG image exists yet. Individual
  // pages' own `title`/`description` still flow into this via Next's
  // metadata inheritance; this just adds the openGraph/twitter shape that
  // was otherwise completely absent.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Moira Events | Weddings, Parties & Corporate Events",
    description: DESCRIPTION,
    images: [{ url: "/images/moira-events-logo.png", width: 1496, height: 706, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moira Events | Weddings, Parties & Corporate Events",
    description: DESCRIPTION,
    images: ["/images/moira-events-logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
