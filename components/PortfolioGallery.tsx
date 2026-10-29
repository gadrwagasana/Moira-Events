"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

export type PortfolioItemView = {
  id: string;
  title: string;
  eventType: "WEDDING" | "PARTY" | "CORPORATE";
  guestCount: number | null;
  venueOrCity: string | null;
  story: string | null;
  imageUrl: string | null;
  alt: string | null;
};

// Shared by the card grid and the lightbox — falls back to the branded
// monogram both when no imageUrl is set AND when a configured one fails to
// load (deleted, host down, 404), so a dead pasted URL never shows a
// broken-image icon. next/image can't know a remote fetch will fail ahead
// of render time, so this needs onError + client state rather than a
// server-side check.
function PortfolioMedia({ imageUrl, alt, imageClassName }: { imageUrl: string | null; alt: string; imageClassName: string }) {
  const [loadFailed, setLoadFailed] = useState(false);
  return imageUrl && !loadFailed ? (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      className={imageClassName}
      onError={() => setLoadFailed(true)}
    />
  ) : (
    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
      <Image
        src="/images/moira-events-logo.png"
        alt=""
        width={1496}
        height={706}
        className="w-1/3 max-w-[140px] opacity-20"
      />
    </div>
  );
}

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "WEDDING", label: "Weddings" },
  { value: "PARTY", label: "Parties & Social Events" },
  { value: "CORPORATE", label: "Corporate Events" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export function PortfolioGallery({ items }: { items: PortfolioItemView[] }) {
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const filtered = useMemo(
    () => (filter === "ALL" ? items : items.filter((item) => item.eventType === filter)),
    [items, filter],
  );

  function openLightbox(index: number, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setOpenIndex(index);
  }

  function closeLightbox() {
    setOpenIndex(null);
    triggerRef.current?.focus();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-espresso-200 bg-ivory-50 p-12 text-center">
        <p className="text-ink-muted">
          Case studies from real events are coming soon — check back shortly, or explore what each division offers
          below.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter portfolio by event type">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`focus-ring rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.value
                ? "border-espresso-600 bg-espresso-600 text-ivory-100"
                : "border-espresso-200 bg-ivory-50 text-ink/80 hover:border-espresso-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">No case studies in this category yet.</p>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={(e) => openLightbox(index, e.currentTarget)}
              className="focus-ring card-interactive group relative flex flex-col overflow-hidden rounded-xl text-left"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-ivory-200 to-espresso-100">
                <PortfolioMedia
                  imageUrl={item.imageUrl}
                  alt={item.alt || item.title}
                  imageClassName="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-serif text-lg text-espresso-700">{item.title}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-espresso-500">
                  {EVENT_TYPE_LABELS[item.eventType]}
                  {item.venueOrCity ? ` · ${item.venueOrCity}` : ""}
                  {item.guestCount ? ` · ${item.guestCount} guests` : ""}
                </p>
                {item.story && <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{item.story}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {openIndex !== null && filtered[openIndex] && (
        <Lightbox
          item={filtered[openIndex]}
          onClose={closeLightbox}
          onPrev={filtered.length > 1 ? () => setOpenIndex((i) => ((i ?? 0) - 1 + filtered.length) % filtered.length) : undefined}
          onNext={filtered.length > 1 ? () => setOpenIndex((i) => ((i ?? 0) + 1) % filtered.length) : undefined}
        />
      )}
    </>
  );
}

const EVENT_TYPE_LABELS: Record<PortfolioItemView["eventType"], string> = {
  WEDDING: "Wedding",
  PARTY: "Party & Social Event",
  CORPORATE: "Corporate Event",
};

function Lightbox({
  item,
  onClose,
  onPrev,
  onNext,
}: {
  item: PortfolioItemView;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft" && onPrev) {
        e.preventDefault();
        onPrev();
        return;
      }
      if (e.key === "ArrowRight" && onNext) {
        e.preventDefault();
        onNext();
        return;
      }
      if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-900/80 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-ivory-50"
      >
        <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-ivory-200 to-espresso-100">
          <PortfolioMedia imageUrl={item.imageUrl} alt={item.alt || item.title} imageClassName="object-cover" />
        </div>
        <div className="overflow-y-auto p-6">
          <h2 className="font-serif text-2xl text-espresso-700">{item.title}</h2>
          <p className="mt-1 text-sm font-medium uppercase tracking-wide text-espresso-500">
            {EVENT_TYPE_LABELS[item.eventType]}
            {item.venueOrCity ? ` · ${item.venueOrCity}` : ""}
            {item.guestCount ? ` · ${item.guestCount} guests` : ""}
          </p>
          {item.story && <p className="mt-4 text-sm text-ink-muted">{item.story}</p>}
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="focus-ring absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-ivory-50/90 text-espresso-700 shadow-sm hover:bg-ivory-100"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ×
          </span>
        </button>
        {onPrev && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous"
            className="focus-ring absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory-50/90 text-espresso-700 shadow-sm hover:bg-ivory-100"
          >
            <span aria-hidden="true">←</span>
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Next"
            className="focus-ring absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory-50/90 text-espresso-700 shadow-sm hover:bg-ivory-100"
          >
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
