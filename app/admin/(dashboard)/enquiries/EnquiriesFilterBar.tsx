"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { value: string; label: string };

// Type/Status apply immediately on change; the search box is debounced
// (~300ms) so every keystroke doesn't trigger a navigation. All three write
// to the URL query string (not component state alone) so filters survive a
// refresh/share/back-button, and changing any filter resets `page` back to
// the first page — a stale page number past the new, smaller result set
// would otherwise silently render nothing.
export function EnquiriesFilterBar({ typeOptions, statusOptions }: { typeOptions: Option[]; statusOptions: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";

  const [q, setQ] = useState(urlQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the local input in sync if the URL changes from elsewhere (e.g. the
  // "Clear filters" button, or the browser back button) — adjusted during
  // render rather than in an Effect, per React's own guidance for this
  // "reset local state when a prop/derived value changes" case.
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setQ(urlQ);
  }

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  }

  function handleSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams({ q: value || null }), 300);
  }

  const type = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";
  const hasFilters = Boolean(q || type || status);

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="field-label" htmlFor="q">Search</label>
        <input
          className="field-input w-64"
          id="q"
          type="text"
          value={q}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Name, email, or reference"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="type">Type</label>
        <select
          className="field-input w-auto"
          id="type"
          value={type}
          onChange={(e) => updateParams({ type: e.target.value || null })}
        >
          <option value="">All</option>
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="status">Status</label>
        <select
          className="field-input w-auto"
          id="status"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value || null })}
        >
          <option value="">All</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push(pathname);
          }}
          className="focus-ring rounded-md text-sm text-espresso-600 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
