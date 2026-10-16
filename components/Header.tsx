"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { primaryNav } from "@/lib/content/nav";

export function Header() {
  const [open, setOpen] = useState(false);
  const [mobileGroupOpen, setMobileGroupOpen] = useState<string | null>(null);
  const pathname = usePathname();

  // Every mobile-menu close (hamburger toggle, logo click, or navigating via
  // any link inside it) should also collapse any expanded submenu — otherwise
  // reopening the menu later shows a stale expanded group.
  function closeMobileMenu() {
    setOpen(false);
    setMobileGroupOpen(null);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-espresso-200 bg-ivory-400/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between gap-6 px-6 py-3">
        <Link
          href="/"
          onClick={closeMobileMenu}
          aria-label="Moira Events — Home"
          className="shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-400"
        >
          <Logo className="h-12 w-auto" />
        </Link>

        {/* Desktop nav switches on at xl (1280px), not the more common lg
            (1024px): logo + 7 nav items + Client Login + a CTA button all in
            one row genuinely doesn't have room at 1024px — tablet-landscape
            and small-laptop widths get the mobile hamburger menu instead,
            which has plenty of room (responsive design audit finding). */}
        <nav className="hidden items-center gap-6 xl:flex">
          {primaryNav.map((item) => {
            const active =
              pathname === item.href || (item.children?.some((c) => c.href === pathname) ?? false);
            const linkFocusRing =
              "rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-400";

            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap border-b-2 pb-1 text-sm font-medium transition-colors hover:text-espresso-600 ${linkFocusRing} ${
                    active ? "border-espresso-600 text-espresso-600" : "border-transparent text-ink/70"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={item.href} className="group relative">
                {/* Disclosure trigger only — does not navigate, matching the
                    mobile pattern below. "Our Events" has no overview page
                    of its own, so clicking it to land on one specific child
                    (/weddings) would be misleading; opening the menu is the
                    whole point of this item. */}
                <button
                  type="button"
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1 whitespace-nowrap border-b-2 pb-1 text-sm font-medium transition-colors hover:text-espresso-600 ${linkFocusRing} ${
                    active ? "border-espresso-600 text-espresso-600" : "border-transparent text-ink/70"
                  }`}
                >
                  {item.label}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="invisible absolute left-0 top-full z-20 min-w-[240px] pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="rounded-lg border border-espresso-100 bg-ivory-50 py-2 shadow-lg">
                    {item.children.map((child) => {
                      const childActive = child.href === pathname;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          aria-current={childActive ? "page" : undefined}
                          className={`block border-l-2 px-4 py-2 text-sm transition-colors hover:bg-espresso-100/60 hover:text-espresso-600 focus:outline-none focus-visible:bg-espresso-100/60 focus-visible:text-espresso-600 ${
                            childActive
                              ? "border-espresso-600 bg-espresso-100/40 font-medium text-espresso-700"
                              : "border-transparent text-ink/80"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 xl:flex">
          <Link
            href="/portal/login"
            className="whitespace-nowrap rounded-sm text-sm font-medium text-ink/70 transition-colors hover:text-espresso-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-400"
          >
            Client Login
          </Link>
          <Link href="/request-a-quote" className="btn-primary px-5 py-2 text-sm">
            Request a Quote
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-espresso-200 text-espresso-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-400 xl:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => (open ? closeMobileMenu() : setOpen(true))}
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Always mounted (not conditionally rendered) so the open/close
          transition can animate via grid-template-rows; `inert` removes it
          from tab order and the accessibility tree while collapsed, so
          keyboard/AT users can't land on hidden links (React 19 supports
          `inert` as a plain DOM prop). */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out xl:hidden ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        inert={!open}
      >
        <div className="overflow-hidden">
        <nav className="flex flex-col gap-1 border-t border-espresso-100 bg-ivory-100 px-6 py-4">
          {primaryNav.map((item) => {
            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-2 text-sm font-medium text-ink/80 hover:bg-espresso-50 hover:text-espresso-600"
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              );
            }

            const expanded = mobileGroupOpen === item.label;
            return (
              <div key={item.label}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-medium text-ink/80 hover:bg-espresso-50 hover:text-espresso-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100"
                  aria-expanded={expanded}
                  onClick={() => setMobileGroupOpen(expanded ? null : item.label)}
                >
                  {item.label}
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {expanded && (
                  <div className="ml-3 flex flex-col gap-1 border-l border-espresso-100 pl-3">
                    {item.children.map((child) => {
                      const childActive = child.href === pathname;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          aria-current={childActive ? "page" : undefined}
                          className={`rounded-md px-2 py-2 text-sm hover:bg-espresso-50 hover:text-espresso-600 ${
                            childActive ? "font-medium text-espresso-600" : "text-ink/70"
                          }`}
                          onClick={closeMobileMenu}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <Link
            href="/portal/login"
            className="rounded-md px-2 py-2 text-sm font-medium text-ink/80 hover:bg-espresso-50 hover:text-espresso-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100"
            onClick={closeMobileMenu}
          >
            Client Login
          </Link>
          <Link
            href="/request-a-quote"
            className="btn-primary mt-2 justify-center"
            onClick={closeMobileMenu}
          >
            Request a Quote
          </Link>
        </nav>
        </div>
      </div>
    </header>
  );
}
