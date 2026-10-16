export type DateRangeParams = { from?: string; to?: string };

// Same from/to query-string-to-Date pattern already established in
// lib/audit/data.ts — `to` is treated as inclusive of the whole day.
export function parseDateRangeWhere(field: string, { from, to }: DateRangeParams): Record<string, unknown> {
  if (!from && !to) return {};
  return {
    [field]: {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    },
  };
}

// A date-ranged filter against "whichever of two date fields is set" —
// e.g. Payment.paymentDate is optional and never auto-set for manual
// payments (lib/audit's updatePaymentStatus never touches it), so a
// date-ranged aggregate must fall back to createdAt rather than silently
// dropping rows with no paymentDate. Builds a single OR clause, not two
// round-trip queries.
export function coalescedDateRangeWhere(
  primaryField: string,
  fallbackField: string,
  range: DateRangeParams,
): Record<string, unknown> {
  const { from, to } = range;
  if (!from && !to) return {};
  const bounds: Record<string, unknown> = {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
  };
  return {
    OR: [{ [primaryField]: bounds }, { [primaryField]: null, [fallbackField]: bounds }],
  };
}

export const CURRENCY_UNSPECIFIED_LABEL = "Unspecified currency";

export function currencyLabel(currency: string | null | undefined): string {
  return currency && currency.trim() ? currency : CURRENCY_UNSPECIFIED_LABEL;
}
