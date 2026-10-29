import { z } from "zod";

// CMS Phase 2 — mirrors components/cms/RichTextRenderer.tsx's allow-list
// exactly, so a section is rejected at WRITE time if it could never render
// as anything (or could only render by being silently stripped down to
// nothing), rather than that only being discovered once a visitor hits a
// mostly-blank published page. Pure schema + helper: no database or
// Next.js import, so it's directly unit-testable without either (see
// scripts/verify-cms-phase1-security.ts). This is a second, independent
// check — the renderer's own allow-list stays in place regardless, so
// content stored before this validation existed (there is none yet; no
// migration has been applied) is still rendered safely either way.
export const SECTION_TYPES = ["richtext"] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

const ALLOWED_NODE_TYPES = [
  "doc",
  "paragraph",
  "heading",
  "text",
  "bulletList",
  "orderedList",
  "listItem",
  "image",
  "hardBreak",
] as const;
const ALLOWED_MARK_TYPES = ["bold", "italic", "link"] as const;

const markSchema = z.object({
  type: z.enum(ALLOWED_MARK_TYPES),
  attrs: z.record(z.string(), z.unknown()).optional(),
});

type TiptapNodeInput = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNodeInput[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

// z.lazy is required here because the schema is recursive (a node's
// `content` array holds more nodes of the same shape).
export const tiptapNodeSchema: z.ZodType<TiptapNodeInput> = z.lazy(() =>
  z.object({
    type: z.enum(ALLOWED_NODE_TYPES),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(tiptapNodeSchema).max(500).optional(),
    text: z.string().max(20000).optional(),
    marks: z.array(markSchema).max(10).optional(),
  }),
);

export const richTextDocSchema = tiptapNodeSchema.refine((node) => node.type === "doc", {
  message: 'Section content must be a Tiptap document (type: "doc")',
});

// A generous but real ceiling — bounds storage/DB-row size and caps the
// cost of validating and later rendering a single section, without being
// so tight it rejects a normal, long piece of editorial content.
export const MAX_SECTION_CONTENT_BYTES = 100_000;

export function validateSectionContent(content: unknown): { ok: true } | { ok: false; message: string } {
  let serialized: string;
  try {
    serialized = JSON.stringify(content ?? null);
  } catch {
    return { ok: false, message: "Section content could not be serialized." };
  }
  if (serialized.length > MAX_SECTION_CONTENT_BYTES) {
    return { ok: false, message: "Section content is too large." };
  }
  const result = richTextDocSchema.safeParse(content);
  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? "Invalid section content." };
  }
  return { ok: true };
}
