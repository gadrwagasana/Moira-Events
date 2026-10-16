import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

type RenderableDocument = Parameters<typeof renderToBuffer>[0];

// One shared call site for @react-pdf/renderer's renderToBuffer — used by
// the 6 HTTP PDF routes below (via createPdfResponse) and by the Stage L2
// email-attachment pipeline (lib/email/outbox.ts's buildMessage thunks).
export async function renderPdfBuffer(element: RenderableDocument): Promise<Buffer> {
  return renderToBuffer(element);
}

// `inline` (not `attachment`) so one link satisfies both "download" and
// "preview" (Stage L1 §16) — the browser's own PDF viewer opens it, Save is
// still available. Split from renderPdfBuffer (Stage M) so a caller that
// needs the raw buffer too (e.g. to compute a size/checksum for
// DocumentRecord) can do so without rendering twice.
export function pdfBufferToResponse(buffer: Buffer, filename: string): NextResponse {
  // Buffer's backing ArrayBufferLike (which admits SharedArrayBuffer) isn't
  // structurally assignable to BlobPart — copy into a fresh, plain
  // ArrayBuffer-backed Uint8Array first.
  const bytes = Uint8Array.from(buffer);
  const blob = new Blob([bytes], { type: "application/pdf" });

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      // Every caller of this is behind an authenticated, per-user/per-client
      // gate (admin or portal session) — never let a shared/intermediary
      // cache or a shared-device browser history replay one person's
      // document to another (Stage P audit finding).
      "Cache-Control": "private, no-store",
    },
  });
}

export async function createPdfResponse(element: RenderableDocument, filename: string): Promise<NextResponse> {
  const buffer = await renderPdfBuffer(element);
  return pdfBufferToResponse(buffer, filename);
}
