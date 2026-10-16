import { Text, View } from "@react-pdf/renderer";
import { pdfStyles } from "./pdf-styles";
import type { CompanyInfo } from "./types";

// Shared across all three document types (Stage L1 §25) — fixed position,
// repeats on every page, only ever shows information actually in the system.
export function DocumentFooter({ company, documentNumber }: { company: CompanyInfo; documentNumber: string }) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text>
        {company.name} · {company.tagline}
      </Text>
      <Text>Document No: {documentNumber}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}
