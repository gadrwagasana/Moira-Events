import Link from "next/link";
import { CmsImage } from "./CmsImage";
import type { Division } from "@/lib/content/divisions";
import type { ResolvedSiteImageSlot } from "@/lib/site-images/data";

export function DivisionCard({ division, imageSlot }: { division: Division; imageSlot: ResolvedSiteImageSlot }) {
  return (
    <div className="card-interactive group relative flex flex-col overflow-hidden">
      <div className="overflow-hidden">
        <CmsImage
          slot={imageSlot}
          nearbyHeading={division.name}
          className="aspect-[16/10] transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-2xl text-espresso-700">{division.name}</h3>
        <p className="mt-2 flex-1 text-sm text-ink-muted">{division.summary}</p>
        {/* The whole card is the tap target (stretched-link on the one real
            link below), not just this line of text — a 44x44px+ hit area
            instead of a single inline text link. */}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-espresso-600 transition-colors group-hover:text-espresso-700">
          <Link href={`/${division.slug}`} className="stretched-link focus-ring rounded">
            Explore {division.shortName}
          </Link>
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </div>
  );
}
