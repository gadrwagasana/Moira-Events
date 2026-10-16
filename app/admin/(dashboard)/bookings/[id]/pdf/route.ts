import { NextResponse } from "next/server";
import { getBookingDocumentForAdmin } from "@/lib/documents/booking";
import { BookingPdf } from "@/lib/documents/booking-pdf";
import { renderPdfBuffer, pdfBufferToResponse } from "@/lib/documents/render";
import { recordDocumentGenerated } from "@/lib/documents/record";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const doc = await getBookingDocumentForAdmin(id);
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await renderPdfBuffer(BookingPdf({ doc }));

  await recordDocumentGenerated({
    type: "BOOKING_CONFIRMATION",
    relatedRecordId: id,
    referenceNumber: doc.documentNumber,
    filename: doc.filename,
    buffer,
    actorType: "ADMIN",
    actorId: "admin",
  });

  return pdfBufferToResponse(buffer, doc.filename);
}
