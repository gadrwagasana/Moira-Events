import { BookingStatus } from "@/lib/generated/prisma/client";

// Never PENDING (not yet confirmed — nothing to confirm to the client) or
// CANCELLED (dead state).
export const SENDABLE_BOOKING_STATUSES: BookingStatus[] = ["CONFIRMED", "IN_PLANNING", "READY", "COMPLETED"];

export function isBookingSendable(status: BookingStatus): boolean {
  return SENDABLE_BOOKING_STATUSES.includes(status);
}
