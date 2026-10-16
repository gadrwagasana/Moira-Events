import Link from "next/link";
import { PlaceholderImage } from "./PlaceholderImage";
import type { Division } from "@/lib/content/divisions";

export function DivisionCard({ division }: { division: Division }) {
  return (
    <div className="card-interactive group flex flex-col overflow-hidden">
      <div className="overflow-hidden">
        <PlaceholderImage
          label={division.shortName}
          className="aspect-[16/10] rounded-none transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-2xl text-espresso-700">{division.name}</h3>
        <p className="mt-2 flex-1 text-sm text-ink/70">{division.summary}</p>
        <Link
          href={`/${division.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-espresso-600 transition-colors group-hover:text-espresso-700"
        >
          Explore {division.shortName}
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}
