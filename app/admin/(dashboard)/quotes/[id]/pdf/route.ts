import { NextResponse } from "next/server";
import { getQuoteDocumentForAdmin } from "@/lib/documents/quote";
import { QuotePdf } from "@/lib/documents/quote-pdf";
import { renderPdfBuffer, pdfBufferToResponse } from "@/lib/documents/render";
import { recordDocumentGenerated } from "@/lib/documents/record";

// Admin auth is already enforced by proxy.ts's /admin/:path* matcher, same
// as every other admin route in this app — no new auth code needed here.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const doc = await getQuoteDocumentForAdmin(id);
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await renderPdfBuffer(QuotePdf({ doc }));

  // Only recorded once a document was actually built, never on the 404
  // above (Stage M).
  await recordDocumentGenerated({
    type: "QUOTE",
    relatedRecordId: id,
    referenceNumber: doc.documentNumber,
    version: doc.version,
    filename: doc.filename,
    buffer,
    actorType: "ADMIN",
    actorId: "admin",
  });

  return pdfBufferToResponse(buffer, doc.filename);
}
