import Image from "next/image";

// Full official logo (monogram + wordmark) — the only logo asset in use.
// The previous header used a separately cropped "wordmark-only" PNG derived
// from this file, which had its own (much wider, oddly tracked) proportions
// and was the source of the header sizing issues — removed in favor of
// always rendering the real official logo image, just at a smaller height.
export function Logo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/images/moira-events-logo.png"
      alt="Moira Events"
      width={1496}
      height={706}
      className={className}
      style={{ width: "auto" }}
      priority
    />
  );
}
