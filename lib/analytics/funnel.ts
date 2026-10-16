import { prisma } from "@/lib/db";
import { EnquiryStatus, QuoteStatus, BookingStatus, ConsultationStatus } from "@/lib/generated/prisma/client";
import { parseDateRangeWhere, type DateRangeParams } from "./date-range";
import { getConsultationCounts } from "./operational";

export const FUNNEL_METHODOLOGY_NOTE =
  "This is a cohort-by-creation-date funnel: each stage counts distinct enquiries submitted in the selected " +
  "range that have ever reached that stage, regardless of when the later stage itself happened. Quote has no " +
  "status-history log and its \"issue date\" is a manually-typed admin field, not an auto-set send timestamp — " +
  "so \"Quoted\" is a current-status proxy (a quote cancelled straight from Draft, never sent, would not be " +
  "miscounted, but one cancelled after being sent would still show as \"not quoted\" if its status moved " +
  "straight to Cancelled). Consultations are reported separately below, not as a funnel stage, because " +
  "Consultation has no relation to Enquiry in the data model — it is an independent intake path.";

export type FunnelStage = { key: string; label: string; count: number; percentOfEnquiries: number };

export type FunnelReport = {
  stages: FunnelStage[];
  lost: number;
  consultations: { status: ConsultationStatus; count: number }[];
  methodologyNote: string;
};

export async function getFunnelReport(range: DateRangeParams): Promise<FunnelReport> {
  const submittedWhere = parseDateRangeWhere("submittedAt", range);

  const [enquiries, quoted, accepted, booked, lost, consultations] = await Promise.all([
    prisma.enquiry.count({ where: { ...submittedWhere } }),
    prisma.enquiry.count({
      where: { ...submittedWhere, quotes: { some: { status: { notIn: [QuoteStatus.DRAFT, QuoteStatus.INTERNAL_REVIEW] } } } },
    }),
    prisma.enquiry.count({
      where: { ...submittedWhere, quotes: { some: { status: QuoteStatus.ACCEPTED } } },
    }),
    prisma.enquiry.count({
      where: {
        ...submittedWhere,
        quotes: {
          some: {
            status: QuoteStatus.ACCEPTED,
            booking: { is: { status: { not: BookingStatus.CANCELLED } } },
          },
        },
      },
    }),
    prisma.enquiry.count({
      where: { ...submittedWhere, status: { in: [EnquiryStatus.CANCELLED, EnquiryStatus.DECLINED] } },
    }),
    getConsultationCounts(range),
  ]);

  const pct = (n: number) => (enquiries > 0 ? (n / enquiries) * 100 : 0);

  const stages: FunnelStage[] = [
    { key: "enquiries", label: "Enquiries received", count: enquiries, percentOfEnquiries: pct(enquiries) },
    { key: "quoted", label: "Quoted", count: quoted, percentOfEnquiries: pct(quoted) },
    { key: "accepted", label: "Quote accepted", count: accepted, percentOfEnquiries: pct(accepted) },
    { key: "booked", label: "Booked", count: booked, percentOfEnquiries: pct(booked) },
  ];

  return { stages, lost, consultations, methodologyNote: FUNNEL_METHODOLOGY_NOTE };
}
