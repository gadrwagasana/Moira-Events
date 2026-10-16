import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles, logoBuffer } from "./pdf-styles";
import { DocumentFooter } from "./footer";
import { formatDate, formatCurrencyLine, emptyValue } from "./format";
import type { BookingDocument } from "./types";

export function BookingPdf({ doc }: { doc: BookingDocument }) {
  return (
    <Document title={`Moira Events Booking Confirmation ${doc.documentNumber}`}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerRow}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- this is @react-pdf/renderer's Image (PDF primitive), not next/image or <img>; it has no alt prop */}
            <Image src={logoBuffer} style={pdfStyles.companyLogo} />
            <Text style={pdfStyles.companyTagline}>{doc.company.tagline}</Text>
          </View>
          <View style={pdfStyles.docTitleBlock}>
            <Text style={pdfStyles.docTitle}>BOOKING CONFIRMATION</Text>
            <View style={pdfStyles.docMetaRow}>
              <Text style={pdfStyles.docMetaLabel}>Booking No: </Text>
              <Text>{doc.documentNumber}</Text>
            </View>
            <View style={pdfStyles.docMetaRow}>
              <Text style={pdfStyles.docMetaLabel}>Status: </Text>
              <Text>{doc.status}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.twoColRow}>
          <View style={pdfStyles.col}>
            <Text style={pdfStyles.sectionTitle}>Client</Text>
            <View style={pdfStyles.infoLine}>
              <Text style={pdfStyles.infoLabel}>Name:</Text>
              <Text style={pdfStyles.infoValue}>{doc.client.fullName}</Text>
            </View>
            <View style={pdfStyles.infoLine}>
              <Text style={pdfStyles.infoLabel}>Email:</Text>
              <Text style={pdfStyles.infoValue}>{doc.client.email}</Text>
            </View>
            <View style={pdfStyles.infoLine}>
              <Text style={pdfStyles.infoLabel}>Phone:</Text>
              <Text style={pdfStyles.infoValue}>{emptyValue(doc.client.phone)}</Text>
            </View>
          </View>
          <View style={pdfStyles.col}>
            <Text style={pdfStyles.sectionTitle}>Event</Text>
            <View style={pdfStyles.infoLine}>
              <Text style={pdfStyles.infoLabel}>Event Type:</Text>
              <Text style={pdfStyles.infoValue}>{emptyValue(doc.event.eventType)}</Text>
            </View>
            {doc.event.weddingTypeName && (
              <View style={pdfStyles.infoLine}>
                <Text style={pdfStyles.infoLabel}>Wedding Type:</Text>
                <Text style={pdfStyles.infoValue}>{doc.event.weddingTypeName}</Text>
              </View>
            )}
            <View style={pdfStyles.infoLine}>
              <Text style={pdfStyles.infoLabel}>Event Date:</Text>
              <Text style={pdfStyles.infoValue}>{formatDate(doc.event.eventDate)}</Text>
            </View>
            <View style={pdfStyles.infoLine}>
              <Text style={pdfStyles.infoLabel}>Venue:</Text>
              <Text style={pdfStyles.infoValue}>{emptyValue(doc.event.location)}</Text>
            </View>
            <View style={pdfStyles.infoLine}>
              <Text style={pdfStyles.infoLabel}>Est. Guests:</Text>
              <Text style={pdfStyles.infoValue}>{doc.event.estimatedGuests ?? "—"}</Text>
            </View>
          </View>
        </View>

        <Text style={pdfStyles.sectionTitle}>Agreed Services</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeaderRow}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDescription, { width: "78%" }]}>Service</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colAmount]}>Amount</Text>
          </View>
          {doc.services.map((service, i) => (
            <View style={pdfStyles.tableRow} key={i} wrap={false}>
              <Text style={[pdfStyles.colDescription, { width: "78%" }]}>{service.description}</Text>
              <Text style={pdfStyles.colAmount}>{formatCurrencyLine(service.lineTotal, null)}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.totalsBlock}>
          <View style={pdfStyles.grandTotalRow}>
            <Text style={pdfStyles.grandTotalLabel}>Agreed Total</Text>
            <Text style={pdfStyles.grandTotalValue}>{formatCurrencyLine(doc.agreedTotal, doc.currency)}</Text>
          </View>
        </View>

        <View style={pdfStyles.noteBlock}>
          <Text style={pdfStyles.noteLabel}>Important Event Information</Text>
          <Text style={pdfStyles.noteText}>Booking Status: {doc.status}</Text>
        </View>

        <DocumentFooter company={doc.company} documentNumber={doc.documentNumber} />
      </Page>
    </Document>
  );
}
