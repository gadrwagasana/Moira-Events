import { NextResponse } from "next/server";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getInvoiceDocumentForClient } from "@/lib/documents/invoice";
import { InvoicePdf } from "@/lib/documents/invoice-pdf";
import { renderPdfBuffer, pdfBufferToResponse } from "@/lib/documents/render";
import { recordDocumentGenerated } from "@/lib/documents/record";

// Ownership is enforced inside getInvoiceDocumentForClient (via the existing
// Stage I ownership-scoped loader) — never trust the id alone (§18).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const clientId = await requireAuthenticatedClientId();
  const { id } = await params;

  const doc = await getInvoiceDocumentForClient(clientId, id);
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await renderPdfBuffer(InvoicePdf({ doc }));

  await recordDocumentGenerated({
    type: "INVOICE",
    relatedRecordId: id,
    referenceNumber: doc.documentNumber,
    filename: doc.filename,
    buffer,
    actorType: "CLIENT",
    actorId: clientId,
  });

  return pdfBufferToResponse(buffer, doc.filename);
}
