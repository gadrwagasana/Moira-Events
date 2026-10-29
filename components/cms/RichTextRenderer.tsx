// CMS Phase 1 — renders Tiptap's stored JSON through a strict, explicit
// allow-list of node/mark types. Never dangerouslySetInnerHTML on raw HTML
// — anything not explicitly recognized below is silently dropped, not
// rendered as-is, so stored content can never execute arbitrary markup.
// A Server Component (no client JS needed just to display already-saved
// content) — complete and builds successfully, but not imported by any
// route yet (no public CMS pages exist this phase).
import type { ReactNode } from "react";

type TiptapMark = { type: string; attrs?: Record<string, unknown> };
type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
};

const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "heading",
  "text",
  "bulletList",
  "orderedList",
  "listItem",
  "image",
  "hardBreak",
]);
const ALLOWED_MARK_TYPES = new Set(["bold", "italic", "link"]);

// The allow-listed node/mark TYPES alone aren't enough — an allowed mark's
// attrs can still carry a javascript:/vbscript:/data: URI, which a browser
// will execute on click (href) or load as script (some data: forms). Only
// an explicit scheme allow-list closes this; a same-origin relative URL
// (no "scheme:" prefix at all, e.g. "/weddings", "#section") can't invoke a
// script-executing protocol handler, so it's always allowed.
const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);
const HAS_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function isSafeUrl(raw: string, allowedProtocols: Set<string>): boolean {
  if (!HAS_SCHEME.test(raw)) return true;
  try {
    return allowedProtocols.has(new URL(raw).protocol);
  } catch {
    return false;
  }
}

function renderMarks(text: string, marks: TiptapMark[] | undefined, key: string): ReactNode {
  let node: ReactNode = text;
  for (const mark of marks ?? []) {
    if (!ALLOWED_MARK_TYPES.has(mark.type)) continue;
    if (mark.type === "bold") node = <strong key={key}>{node}</strong>;
    else if (mark.type === "italic") node = <em key={key}>{node}</em>;
    else if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : undefined;
      if (!href || !isSafeUrl(href, SAFE_LINK_PROTOCOLS)) continue;
      node = (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow" className="underline">
          {node}
        </a>
      );
    }
  }
  return node;
}

function renderNode(node: TiptapNode, key: string): ReactNode {
  if (!ALLOWED_NODE_TYPES.has(node.type)) return null;

  switch (node.type) {
    case "doc":
      return <>{node.content?.map((child, i) => renderNode(child, `${key}-${i}`))}</>;
    case "paragraph":
      return <p key={key}>{node.content?.map((child, i) => renderNode(child, `${key}-${i}`))}</p>;
    case "heading": {
      const level = typeof node.attrs?.level === "number" ? Math.min(Math.max(Math.round(node.attrs.level), 1), 6) : 2;
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return <Tag key={key}>{node.content?.map((child, i) => renderNode(child, `${key}-${i}`))}</Tag>;
    }
    case "text":
      return renderMarks(node.text ?? "", node.marks, key);
    case "bulletList":
      return <ul key={key}>{node.content?.map((child, i) => renderNode(child, `${key}-${i}`))}</ul>;
    case "orderedList":
      return <ol key={key}>{node.content?.map((child, i) => renderNode(child, `${key}-${i}`))}</ol>;
    case "listItem":
      return <li key={key}>{node.content?.map((child, i) => renderNode(child, `${key}-${i}`))}</li>;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : undefined;
      if (!src || !isSafeUrl(src, SAFE_IMAGE_PROTOCOLS)) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      // eslint-disable-next-line @next/next/no-img-element -- CMS-authored content's URL/dimensions aren't known ahead of time, so next/image can't be used directly here.
      return <img key={key} src={src} alt={alt} loading="lazy" />;
    }
    default:
      return null;
  }
}

export function RichTextRenderer({ content }: { content: unknown }) {
  const doc = content as TiptapNode;
  if (!doc || doc.type !== "doc") return null;
  return <div className="prose prose-sm max-w-none">{renderNode(doc, "root")}</div>;
}
