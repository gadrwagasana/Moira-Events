"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type SidebarLink = { href: string; label: string; badge?: number };
// A heading marker that can be interspersed in the same flat `links` array
// — kept as a union member (not a separate `sections` prop) specifically
// so the client portal's existing flat SidebarLink[] usage keeps working
// unchanged; only the admin layout opts into grouping by inserting these.
export type SidebarHeading = { heading: string };
export type SidebarItem = SidebarLink | SidebarHeading;

function isHeading(item: SidebarItem): item is SidebarHeading {
  return "heading" in item;
}

function isLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ links, pathname, onNavigate }: { links: SidebarItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {links.map((item, index) => {
        if (isHeading(item)) {
          return (
            <p
              key={`heading-${item.heading}`}
              className={`px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink/40 ${index === 0 ? "" : "pt-4"}`}
            >
              {item.heading}
            </p>
          );
        }
        const link = item;
        const isActive = isLinkActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={`focus-ring flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ease-out hover:translate-x-0.5 motion-reduce:hover:translate-x-0 ${
              isActive
                ? "bg-espresso-600 text-ivory-100 shadow-sm"
                : "text-ink/70 hover:bg-ivory-200 hover:text-espresso-700"
            }`}
          >
            {link.label}
            {Boolean(link.badge) && (
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  isActive ? "bg-ivory-100/20 text-ivory-100" : "bg-amber-100 text-amber-800"
                }`}
              >
                {link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ footer, logoutAction }: { footer?: ReactNode; logoutAction: () => void | Promise<void> }) {
  return (
    // Extra bottom padding + a safe-area inset guards Log Out from being
    // covered by Next's dev-mode build-activity indicator (also moved to
    // the opposite corner via next.config.mjs's devIndicators.position) and
    // from a mobile browser's own home-indicator/gesture-bar area.
    <div className="border-t border-espresso-100 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-xs text-ink/60">
      {footer}
      <form action={logoutAction} className="mt-2">
        <button
          type="submit"
          className="focus-ring w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-espresso-600 transition-colors hover:bg-ivory-200"
        >
          Log Out
        </button>
      </form>
    </div>
  );
}

// Shared chrome for both the admin dashboard and the client portal. At `lg`
// and above this renders as the original always-visible sticky sidebar. Below
// `lg` it collapses to a top bar + hamburger button that opens an off-canvas
// drawer (same nav content, rendered a second time) over a backdrop — closes
// on Escape, on backdrop click, and whenever the route changes; traps Tab
// focus while open; returns focus to the button that opened it on close.
export function DashboardSidebar({
  brand,
  brandHref,
  links,
  footer,
  logoutAction,
}: {
  brand: string;
  brandHref: string;
  links: SidebarItem[];
  footer?: ReactNode;
  logoutAction: () => void | Promise<void>;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const drawerId = useId();

  // Close on route change (covers link clicks inside the drawer too, but
  // this also catches back/forward navigation the onClick handler wouldn't)
  // — adjusted during render, not in an Effect, per React's guidance for
  // "reset state when a derived value changes."
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Esc to close, and a Tab/Shift+Tab focus trap confined to the drawer
  // while it's open.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Move focus into the drawer when it opens; return it to the hamburger
  // button when it closes — but only after having actually been open, so
  // this never steals focus on initial page load.
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      const first = drawerRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])');
      first?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      menuButtonRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile/tablet top bar (below lg) */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-espresso-100 bg-ivory-50 px-4 py-3 lg:hidden">
        <Link href={brandHref} className="focus-ring rounded font-serif text-lg text-espresso-700">
          {brand}
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={isOpen}
          aria-controls={drawerId}
          onClick={() => setIsOpen(true)}
          className="focus-ring rounded-md p-2 text-espresso-700 hover:bg-ivory-200"
        >
          <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Desktop sticky sidebar (lg and above) */}
      <aside className="sidebar-in sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-espresso-100 bg-ivory-50 lg:flex">
        <Link href={brandHref} className="focus-ring border-b border-espresso-100 px-5 py-5 font-serif text-lg text-espresso-700">
          {brand}
        </Link>
        <NavLinks links={links} pathname={pathname} />
        <SidebarFooter footer={footer} logoutAction={logoutAction} />
      </aside>

      {/* Off-canvas drawer (below lg only) */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            id={drawerId}
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 flex h-full w-72 max-w-[85vw] flex-col bg-ivory-50 shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-espresso-100 px-4 py-4">
              <span className="font-serif text-lg text-espresso-700">{brand}</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsOpen(false)}
                className="focus-ring rounded-md p-2 text-espresso-700 hover:bg-ivory-200"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NavLinks links={links} pathname={pathname} onNavigate={() => setIsOpen(false)} />
            <SidebarFooter footer={footer} logoutAction={logoutAction} />
          </div>
        </div>
      )}
    </>
  );
}
