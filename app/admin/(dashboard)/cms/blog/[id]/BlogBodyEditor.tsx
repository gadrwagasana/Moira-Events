"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { RichTextEditor } from "@/components/cms/RichTextEditor";
import { saveBlogPostBody } from "@/lib/cms/actions";

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export function BlogBodyEditor({ postId, initialContent }: { postId: string; initialContent: unknown }) {
  const router = useRouter();
  const [content, setContent] = useState<JSONContent>((initialContent as JSONContent) ?? EMPTY_DOC);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const result = await saveBlogPostBody(postId, content);
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
    <div className="space-y-4">
      <RichTextEditor initialContent={content} onChange={setContent} />
      <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
        {saving ? "Saving..." : "Save Draft"}
      </button>
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
