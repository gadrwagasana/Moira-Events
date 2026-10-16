import { getFunnelReport } from "@/lib/analytics/funnel";
import { buildCsv, csvResponse } from "@/lib/analytics/csv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const report = await getFunnelReport({ from, to });

  const rows: unknown[][] = [
    ...report.stages.map((s) => [s.label, s.count, `${s.percentOfEnquiries.toFixed(1)}%`]),
    ["Lost / declined (not a funnel stage)", report.lost, ""],
    [],
    ["Consultations (separate intake path, not a funnel stage)"],
    ...report.consultations.map((c) => [c.status, c.count]),
    [],
    [report.methodologyNote],
  ];

  const csv = buildCsv(["Stage", "Count", "% of enquiries"], rows);
  return csvResponse("moira-events-sales-funnel.csv", csv);
}
