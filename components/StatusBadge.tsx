import { EnquiryStatus } from "@/lib/generated/prisma/client";

// Human-readable labels + a distinct colour per status GROUP (not per status
// — several statuses share the same "in progress" amber, by design, per the
// requested grouping). All pairs below use Tailwind's "100 background / 800
// text" convention, which comfortably clears 4.5:1 contrast.
const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  UNDER_REVIEW: "Under review",
  CONSULTATION: "Consultation",
  QUOTE_PREPARATION: "Preparing quote",
  QUOTE_SENT: "Quote sent",
  CLIENT_REVIEW: "Client review",
  APPROVED: "Approved",
  BOOKED: "Booked",
  IN_PLANNING: "In planning",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DECLINED: "Declined",
};

const ENQUIRY_STATUS_COLORS: Record<EnquiryStatus, string> = {
  NEW: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  CONSULTATION: "bg-amber-100 text-amber-800",
  QUOTE_PREPARATION: "bg-amber-100 text-amber-800",
  QUOTE_SENT: "bg-amber-100 text-amber-800",
  CLIENT_REVIEW: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  BOOKED: "bg-green-100 text-green-800",
  IN_PLANNING: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-200 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  DECLINED: "bg-red-100 text-red-800",
};

export function enquiryStatusLabel(status: EnquiryStatus): string {
  return ENQUIRY_STATUS_LABELS[status];
}

export const ENQUIRY_STATUS_OPTIONS: { value: EnquiryStatus; label: string }[] = Object.values(EnquiryStatus).map(
  (status) => ({ value: status, label: ENQUIRY_STATUS_LABELS[status] }),
);

export function StatusBadge({ status }: { status: EnquiryStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ENQUIRY_STATUS_COLORS[status]}`}>
      {ENQUIRY_STATUS_LABELS[status]}
    </span>
  );
}
