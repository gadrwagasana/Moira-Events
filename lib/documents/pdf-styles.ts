import fs from "fs";
import path from "path";
import { StyleSheet } from "@react-pdf/renderer";

// Read once as a Buffer (not a path string) — @react-pdf/image's local-path
// detection does `new URL(src)` then falls back to a regex that mistakes a
// Windows drive letter ("D:") for a URI scheme, misrouting the whole thing
// through a network fetch() instead of reading the file. Passing a Buffer
// bypasses that path/URL detection entirely (checked first, unconditionally).
export const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "images", "moira-events-logo.png"));

// Shared across all three document types so they read as one consistent
// Moira Events document family (Stage L1 §10) — professional, readable,
// printable; deliberately not overdesigned.
export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#241f1c",
  },
  companyLogo: {
    width: 130,
    height: 61,
  },
  companyTagline: {
    fontSize: 9,
    color: "#666666",
    marginTop: 4,
  },
  docTitleBlock: {
    alignItems: "flex-end",
  },
  docTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#5c4033",
    letterSpacing: 1,
  },
  docMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
  },
  docMetaLabel: {
    color: "#666666",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#5c4033",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  twoColRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  col: {
    width: "48%",
  },
  infoLine: {
    flexDirection: "row",
    marginBottom: 2,
  },
  infoLabel: {
    width: 70,
    color: "#666666",
  },
  infoValue: {
    flex: 1,
  },
  table: {
    marginTop: 8,
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#5c4033",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#d9c1b5",
    paddingVertical: 4,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#5c4033",
  },
  colDescription: { width: "46%" },
  colQty: { width: "12%", textAlign: "center" },
  colUnitPrice: { width: "20%", textAlign: "right" },
  colAmount: { width: "22%", textAlign: "right" },
  totalsBlock: {
    marginLeft: "auto",
    width: "45%",
    marginTop: 8,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalsLabel: {
    color: "#666666",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#5c4033",
    marginTop: 4,
    paddingTop: 4,
  },
  grandTotalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  grandTotalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  noteBlock: {
    marginTop: 16,
  },
  noteLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#5c4033",
    marginBottom: 2,
  },
  noteText: {
    color: "#333333",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#d9c1b5",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#888888",
  },
});
