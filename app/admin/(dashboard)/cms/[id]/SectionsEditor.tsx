"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { RichTextEditor } from "@/components/cms/RichTextEditor";
import { saveCmsPageSections } from "@/lib/cms/actions";

type Section = { key: string; type: string; content: unknown };

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

function makeKey(): string {
  // A client-only identity for React's key/Tiptap-instance stability while
  // reordering — never sent to the server. Using array index instead would
  // make React reuse a section's DOM/editor instance across a reorder swap
  // without Tiptap re-syncing its displayed content to match (Tiptap only
  // reads `content` once, on mount) — the editor would keep showing its
  // OLD content in its NEW position. Keying by this stable id instead
  // makes each editor instance follow its own section when moved.
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s${Math.random().toString(36).slice(2)}`;
}

export function SectionsEditor({
  pageId,
  initialSections,
}: {
  pageId: string;
  initialSections: { id: string; type: string; sortOrder: number; content: unknown }[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(() =>
    [...initialSections]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ key: s.id, type: s.type, content: s.content })),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function addSection() {
    setSections((prev) => [...prev, { key: makeKey(), type: "richtext", content: EMPTY_DOC }]);
  }
  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }
  function moveSection(index: number, direction: -1 | 1) {
    setSections((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function updateContent(index: number, content: JSONContent) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, content } : s)));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = sections.map((s, i) => ({ type: s.type, sortOrder: i, content: s.content }));
      const result = await saveCmsPageSections(pageId, payload);
      if (result.status === "error") {
        setMessage({ type: "error", text: result.message ?? "Failed to save." });
      } else {
        setMessage({ type: "success", text: "Saved." });
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {sections.length === 0 && <p className="text-sm text-ink/50">No sections yet.</p>}
      {sections.map((section, index) => (
        <div key={section.key} className="space-y-2 rounded-lg border border-espresso-100 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-ink/50">
              Section {index + 1} ({section.type})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-espresso-600 hover:underline disabled:opacity-40"
                onClick={() => moveSection(index, -1)}
                disabled={index === 0}
              >
                Move up
              </button>
              <button
                type="button"
                className="text-xs text-espresso-600 hover:underline disabled:opacity-40"
                onClick={() => moveSection(index, 1)}
                disabled={index === sections.length - 1}
              >
                Move down
              </button>
              <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => removeSection(index)}>
                Remove
              </button>
            </div>
          </div>
          <RichTextEditor initialContent={section.content as JSONContent} onChange={(json) => updateContent(index, json)} />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button type="button" className="btn-secondary" onClick={addSection}>
          Add Section
        </button>
        <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save Draft"}
        </button>
      </div>
      {message && (
        <p
          className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-700"}`}
          role={message.type === "error" ? "alert" : undefined}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
