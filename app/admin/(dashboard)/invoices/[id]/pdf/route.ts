import { NextResponse } from "next/server";
import { getInvoiceDocumentForAdmin } from "@/lib/documents/invoice";
import { InvoicePdf } from "@/lib/documents/invoice-pdf";
import { renderPdfBuffer, pdfBufferToResponse } from "@/lib/documents/render";
import { recordDocumentGenerated } from "@/lib/documents/record";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const doc = await getInvoiceDocumentForAdmin(id);
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
    actorType: "ADMIN",
    actorId: "admin",
  });

  return pdfBufferToResponse(buffer, doc.filename);
}
