"use client";

// CMS Phase 1 — a standalone, working Tiptap editor component. Complete and
// builds successfully, but not imported by any route yet (no CMS admin
// pages exist this phase — see SETUP.md "CMS Phase 1"). Demonstrates the
// extension set and storage format a future page/post editor would use.
//
// Deliberately uses only Tiptap's CORE editor (@tiptap/react +
// @tiptap/starter-kit + extension-link + extension-image), not its newer
// "UI Components" package — that package's own docs say it's not yet
// confirmed compatible with React 19, whereas the core editor works fine
// client-side with immediatelyRender: false. The toolbar below is hand-
// built with plain Tailwind buttons, consistent with this app's existing
// "no UI component library" convention (confirmed: no charting/date/UI
// library is used anywhere else in this codebase either).
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-espresso-600 text-ivory-100" : "text-espresso-700 hover:bg-espresso-100"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  initialContent,
  onChange,
}: {
  initialContent?: JSONContent;
  onChange?: (json: JSONContent) => void;
}) {
  const editor = useEditor({
    // Required for SSR frameworks (Next.js) — without it, the editor
    // renders once on the server and again on the client, risking a
    // hydration mismatch (confirmed current Tiptap v3 guidance).
    immediatelyRender: false,
    // v3 no longer re-renders on every transaction by default — needed so
    // the toolbar's active-state highlighting (bold/italic/etc.) actually
    // updates as the cursor moves.
    shouldRerenderOnTransaction: true,
    extensions: [
      // v3's StarterKit now bundles its own Link extension — disabled here
      // so the separately-configured Link extension below (with explicit,
      // safe link attributes) is the only one active.
      StarterKit.configure({ link: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Image,
    ],
    content: initialContent ?? EMPTY_DOC,
    onUpdate: ({ editor: e }) => onChange?.(e.getJSON()),
    editorProps: {
      attributes: {
        class: "field-input min-h-[200px] prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-espresso-200 bg-ivory-50">
      <div className="flex flex-wrap gap-1 border-b border-espresso-100 p-2">
        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </ToolbarButton>
        <ToolbarButton
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          label="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("URL");
            if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            else editor.chain().focus().unsetLink().run();
          }}
        >
          Link
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
