"use client";

import { useState } from "react";
import Image from "next/image";
import type { ResolvedSiteImageSlot } from "@/lib/site-images/data";

// Tiny solid espresso-toned blur-up placeholder for the real-photo case —
// see components/EventImage.tsx's original comment (this supersedes it).
const DEFAULT_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// Supersedes EventImage: these are CMS-managed slots, edited from
// Admin → Site Images, and must never be hidden or hard-coded. When a slot
// has no photo yet — OR its pasted URL has gone dead (deleted, host down,
// 404) — this renders a polished branded placeholder (soft ivory/espresso
// gradient + a faint centered wordmark) instead of nothing, so the layout
// never collapses and a visitor never sees a blank box or a broken-image
// icon. The load-failure case needs client-side state (next/image can't
// know ahead of render time whether a remote URL will actually resolve),
// which is why this is a Client Component rather than a server one.
export function CmsImage({
  slot,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  // The section heading already sitting next to most of these images — a
  // caption that just repeats it is noise, not information (this was the
  // exact bug in the old PlaceholderImage's caption chip). Only shown when
  // it's a distinct, non-empty addition.
  nearbyHeading,
}: {
  slot: ResolvedSiteImageSlot;
  className?: string;
  priority?: boolean;
  sizes?: string;
  nearbyHeading?: string;
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const showImage = Boolean(slot) && !loadFailed;

  const caption =
    showImage && slot?.caption && slot.caption.trim().toLowerCase() !== (nearbyHeading ?? "").trim().toLowerCase()
      ? slot.caption
      : null;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-ivory-200 to-espresso-100 ${className}`}>
      {showImage && slot ? (
        <Image
          src={slot.imageUrl}
          alt={slot.alt}
          fill
          priority={priority}
          sizes={sizes}
          placeholder="blur"
          blurDataURL={DEFAULT_BLUR_DATA_URL}
          className="object-cover"
          style={{ objectPosition: `${slot.focalX}% ${slot.focalY}%` }}
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/images/moira-events-logo.png"
            alt=""
            width={1496}
            height={706}
            className="w-1/3 max-w-[180px] opacity-20"
          />
        </div>
      )}
      {caption && (
        <p className="absolute inset-x-0 bottom-0 bg-espresso-700/70 px-4 py-2 text-sm text-ivory-100">{caption}</p>
      )}
    </div>
  );
}
