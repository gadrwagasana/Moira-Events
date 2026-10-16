// RFC4180 quoting + OWASP CSV-formula-injection protection. Any cell whose
// first character would be interpreted as a formula trigger by
// Excel/Sheets/LibreOffice (=, +, -, @, tab, CR) gets a leading apostrophe
// prepended BEFORE quoting, so the opening character a spreadsheet sees is
// never one of those.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function escapeCsvField(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (FORMULA_TRIGGER.test(text)) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text)) {
    text = `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function toCsvRow(fields: unknown[]): string {
  return fields.map(escapeCsvField).join(",");
}

export function buildCsv(header: string[], rows: unknown[][]): string {
  const lines = [toCsvRow(header), ...rows.map(toCsvRow)];
  // Leading UTF-8 BOM so Excel opens the file as UTF-8 rather than guessing
  // a local codepage; CRLF line endings per RFC4180.
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Admin-only financial data — never let a shared/intermediary cache or
      // a shared-device browser history replay this (Stage P audit finding).
      "Cache-Control": "private, no-store",
    },
  });
}
