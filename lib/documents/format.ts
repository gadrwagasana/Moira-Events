export function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  // Respect the stored date as-is — never shift for browser/server timezone
  // (Stage L1 §23). All DateTime columns in this schema are naive
  // timestamps (no timezone component), so UTC getters reflect exactly what
  // was stored, with no conversion applied.
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCurrencyLine(value: number | null | undefined, currency: string | null | undefined): string {
  const amount = formatMoney(value);
  if (amount === "—") return amount;
  return currency ? `${amount} ${currency}` : amount;
}

export function emptyValue(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : "—";
}

const DOCUMENT_TYPE_LABEL = { quote: "Quote", invoice: "Invoice", booking: "Booking" } as const;

export function buildFilename(
  type: keyof typeof DOCUMENT_TYPE_LABEL,
  referenceNumber: string,
  version?: number,
): string {
  const safeRef = referenceNumber.replace(/[^a-zA-Z0-9-]/g, "");
  const label = DOCUMENT_TYPE_LABEL[type];
  const versionSuffix = version ? `-v${version}` : "";
  return `Moira-Events-${label}-${safeRef}${versionSuffix}.pdf`;
}
