import { NextResponse } from "next/server";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getPrimaryBookingForClient } from "@/lib/client-portal/data";
import { getBookingDocumentForClient } from "@/lib/documents/booking";
import { BookingPdf } from "@/lib/documents/booking-pdf";
import { renderPdfBuffer, pdfBufferToResponse } from "@/lib/documents/render";
import { recordDocumentGenerated } from "@/lib/documents/record";

export async function GET() {
  const clientId = await requireAuthenticatedClientId();

  const doc = await getBookingDocumentForClient(clientId);
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await renderPdfBuffer(BookingPdf({ doc }));

  const booking = await getPrimaryBookingForClient(clientId);

  await recordDocumentGenerated({
    type: "BOOKING_CONFIRMATION",
    relatedRecordId: booking?.id ?? doc.documentNumber,
    referenceNumber: doc.documentNumber,
    filename: doc.filename,
    buffer,
    actorType: "CLIENT",
    actorId: clientId,
  });

  return pdfBufferToResponse(buffer, doc.filename);
}
