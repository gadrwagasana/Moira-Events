// Covers every /portal/* route — including the auth pages outside the
// (portal) group (login/register/activate/forgot-password/reset-password/
// verify-email), which previously had no page-level noindex at all and
// relied solely on robots.txt's crawl-level Disallow. robots.txt prevents
// crawling, not indexing of an already-linked URL — this closes that gap
// with a real <meta name="robots"> tag (Stage P audit finding).
export const metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
