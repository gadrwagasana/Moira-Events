import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles, logoBuffer } from "./pdf-styles";
import { DocumentFooter } from "./footer";
import { formatDate, formatMoney, formatCurrencyLine, emptyValue } from "./format";
import type { QuoteDocument } from "./types";

export function QuotePdf({ doc }: { doc: QuoteDocument }) {
  return (
    <Document title={`Moira Events Quote ${doc.documentNumber}`}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerRow}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- this is @react-pdf/renderer's Image (PDF primitive), not next/image or <img>; it has no alt prop */}
            <Image src={logoBuffer} style={pdfStyles.companyLogo} />
            <Text style={pdfStyles.companyTagline}>{doc.company.tagline}</Text>
          </View>
          <View style={pdfStyles.docTitleBlock}>
            <Text style={pdfStyles.docTitle}>QUOTE</Text>
            <View style={pdfStyles.docMetaRow}>
              <Text style={pdfStyles.docMetaLabel}>Quote No: </Text>
              <Text>{doc.documentNumber}</Text>
            </View>
            <View style={pdfStyles.docMetaRow}>
              <Text style={pdfStyles.docMetaLabel}>Version: </Text>
              <Text>{doc.version}</Text>
            </View>
            <View style={pdfStyles.docMetaRow}>
              <Text style={pdfStyles.docMetaLabel}>Issue Date: </Text>
              <Text>{formatDate(doc.issueDate)}</Text>
            </View>
            <View style={pdfStyles.docMetaRow}>
              <Text style={pdfStyles.docMetaLabel}>Valid Until: </Text>
              <Text>{formatDate(doc.expiresAt)}</Text>
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
              <Text style={pdfStyles.infoLabel}>Event:</Text>
              <Text style={pdfStyles.infoValue}>{emptyValue(doc.event.eventType)}</Text>
            </View>
            {doc.event.weddingTypeName && (
              <View style={pdfStyles.infoLine}>
                <Text style={pdfStyles.infoLabel}>Wedding Type:</Text>
                <Text style={pdfStyles.infoValue}>{doc.event.weddingTypeName}</Text>
              </View>
            )}
            <View style={pdfStyles.infoLine}>
              <Text style={pdfStyles.infoLabel}>Date:</Text>
              <Text style={pdfStyles.infoValue}>{formatDate(doc.event.eventDate)}</Text>
            </View>
            <View style={pdfStyles.infoLine}>
              <Text style={pdfStyles.infoLabel}>Venue:</Text>
              <Text style={pdfStyles.infoValue}>{emptyValue(doc.event.location)}</Text>
            </View>
            <View style={pdfStyles.infoLine}>
              <Text style={pdfStyles.infoLabel}>Guests:</Text>
              <Text style={pdfStyles.infoValue}>{doc.event.estimatedGuests ?? "—"}</Text>
            </View>
          </View>
        </View>

        <Text style={pdfStyles.sectionTitle}>Services</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeaderRow}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDescription]}>Description</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colQty]}>Qty</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colUnitPrice]}>Unit Price</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colAmount]}>Amount</Text>
          </View>
          {doc.items.map((item, i) => (
            <View style={pdfStyles.tableRow} key={i} wrap={false}>
              <Text style={pdfStyles.colDescription}>{item.description}</Text>
              <Text style={pdfStyles.colQty}>
                {item.quantity}
                {item.unit ? ` ${item.unit}` : ""}
              </Text>
              <Text style={pdfStyles.colUnitPrice}>{formatMoney(item.unitPrice)}</Text>
              <Text style={pdfStyles.colAmount}>{formatMoney(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.totalsBlock}>
          <View style={pdfStyles.totalsRow}>
            <Text style={pdfStyles.totalsLabel}>Subtotal</Text>
            <Text>{formatMoney(doc.subtotal)}</Text>
          </View>
          <View style={pdfStyles.totalsRow}>
            <Text style={pdfStyles.totalsLabel}>Discount</Text>
            <Text>{formatMoney(doc.discountAmount)}</Text>
          </View>
          <View style={pdfStyles.totalsRow}>
            <Text style={pdfStyles.totalsLabel}>Tax</Text>
            <Text>{formatMoney(doc.taxAmount)}</Text>
          </View>
          <View style={pdfStyles.grandTotalRow}>
            <Text style={pdfStyles.grandTotalLabel}>TOTAL</Text>
            <Text style={pdfStyles.grandTotalValue}>{formatCurrencyLine(doc.totalAmount, doc.currency)}</Text>
          </View>
        </View>

        {doc.clientNotes && (
          <View style={pdfStyles.noteBlock}>
            <Text style={pdfStyles.noteLabel}>Notes</Text>
            <Text style={pdfStyles.noteText}>{doc.clientNotes}</Text>
          </View>
        )}
        {doc.terms && (
          <View style={pdfStyles.noteBlock}>
            <Text style={pdfStyles.noteLabel}>Terms & Conditions</Text>
            <Text style={pdfStyles.noteText}>{doc.terms}</Text>
          </View>
        )}

        <DocumentFooter company={doc.company} documentNumber={doc.documentNumber} />
      </Page>
    </Document>
  );
}
