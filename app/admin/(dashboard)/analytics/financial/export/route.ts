import { getFinancialReport, type CurrencyAmount } from "@/lib/analytics/financial";
import { buildCsv, csvResponse } from "@/lib/analytics/csv";

function section(title: string, rows: CurrencyAmount[]): unknown[][] {
  return [[title], ...rows.map((r) => [r.currency, r.amount.toFixed(2)]), []];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const report = await getFinancialReport({ from, to });

  const rows: unknown[][] = [
    ...section("Booked value", report.bookedValue),
    ...section("Invoiced value", report.invoicedValue),
    ...section("Payments received", report.paymentsReceived),
    ...section("Refunds issued", report.refundsIssued),
    ...section("Outstanding balance (as of now)", report.outstandingBalance),
    [report.disclaimer],
  ];

  const csv = buildCsv(["Currency", "Amount"], rows);
  return csvResponse("moira-events-financial-report.csv", csv);
}
