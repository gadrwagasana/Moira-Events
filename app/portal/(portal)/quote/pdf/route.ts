import { NextResponse } from "next/server";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getPrimaryBookingForClient } from "@/lib/client-portal/data";
import { getQuoteDocumentForClient } from "@/lib/documents/quote";
import { QuotePdf } from "@/lib/documents/quote-pdf";
import { renderPdfBuffer, pdfBufferToResponse } from "@/lib/documents/render";
import { recordDocumentGenerated } from "@/lib/documents/record";

export async function GET() {
  const clientId = await requireAuthenticatedClientId();

  const doc = await getQuoteDocumentForClient(clientId);
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await renderPdfBuffer(QuotePdf({ doc }));

  // The quote's own DB id isn't part of the client-safe QuoteDocument shape
  // — re-derived here via the same ownership-scoped loader used elsewhere,
  // not by widening what the document builder exposes.
  const booking = await getPrimaryBookingForClient(clientId);

  await recordDocumentGenerated({
    type: "QUOTE",
    relatedRecordId: booking?.quoteId ?? doc.documentNumber,
    referenceNumber: doc.documentNumber,
    version: doc.version,
    filename: doc.filename,
    buffer,
    actorType: "CLIENT",
    actorId: clientId,
  });

  return pdfBufferToResponse(buffer, doc.filename);
}
