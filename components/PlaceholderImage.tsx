// Stands in for real event photography until the owner supplies a gallery
// (sitemap §8/§15 — portfolio media confirmed as not yet available). Styled
// as a deliberate editorial placeholder (soft texture + caption chip) rather
// than a "broken image" icon, so the brand still reads as premium/finished
// while real photography is pending — never presented as an actual event
// photo (see SETUP.md for the photography dependency this is bridging).
export function PlaceholderImage({
  label,
  caption,
  className = "",
}: {
  label: string;
  caption?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex aspect-[4/3] w-full items-end overflow-hidden rounded-xl bg-gradient-to-br from-espresso-100 via-ivory-200 to-espresso-200 ${className}`}
    >
      {/* Subtle diagonal texture — reads as intentional, not a broken asset */}
      <svg className="absolute inset-0 h-full w-full text-espresso-300/40" aria-hidden="true">
        <defs>
          <pattern id="moira-placeholder-lines" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="22" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#moira-placeholder-lines)" />
      </svg>

      <div className="relative m-4 inline-flex max-w-[calc(100%-2rem)] flex-col gap-0.5 rounded-lg bg-ivory-50/90 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
        <p className="truncate text-sm font-medium text-espresso-600">{label}</p>
        {caption && <p className="truncate text-xs text-espresso-400">{caption}</p>}
      </div>
    </div>
  );
}
