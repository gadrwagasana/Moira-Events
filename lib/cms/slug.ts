import { z } from "zod";

// CMS Phase 2 — extracted out of lib/cms/actions.ts (a "use server" module)
// for two independent reasons:
// 1. generateSlugFromTitle is called directly from a "use client" component
//    for live slug suggestions. Every export from a "use server" file must
//    itself be an async Server Action, so a plain synchronous helper can't
//    live there once a client component needs to call it directly.
// 2. slugSchema/RESERVED_SLUGS are plain values (a Zod schema, a Set), and
//    a "use server" file cannot export anything other than async functions
//    AT ALL — not even a non-function constant. Keeping these here also
//    makes them unit-testable without a database (see
//    scripts/verify-cms-phase1-security.ts), the same reasoning as
//    lib/admin/role.ts and lib/cms/content-schema.ts.
//
// The actual slug a page is saved with is still independently validated
// server-side by lib/cms/actions.ts importing slugSchema from here — the
// client-side suggestion in generateSlugFromTitle is a UX convenience
// only, never trusted as-is.
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Every existing static public route (app/(site)/**/page.tsx), plus the
// framework-reserved top-level paths — Next.js's router always prefers a
// more specific static route over a sibling dynamic [slug] route at the
// same level, so a collision here can't actually break any existing page,
// but it WOULD create a CmsPage that can never be reached at its own URL
// (shadowed by the static route), confusing whoever publishes it. Rejected
// up front instead.
export const RESERVED_SLUGS = new Set([
  "about",
  "book-a-consultation",
  "corporate-events",
  "how-it-works",
  "parties-social-events",
  "request-a-quote",
  "services",
  "weddings",
  "portfolio",
  "contact",
  "blog",
  "admin",
  "portal",
  "api",
  "sitemap.xml",
  "robots.txt",
  "icon",
  "apple-icon",
]);

export const slugSchema = z
  .string()
  .regex(SLUG_PATTERN, "Slug must be lowercase letters, numbers, and hyphens only")
  .refine((slug) => !RESERVED_SLUGS.has(slug), { message: "That slug is reserved for an existing page." });
