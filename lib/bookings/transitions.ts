import { BookingStatus } from "@/lib/generated/prisma/client";

// Linear planning progression, with CANCELLED reachable from any
// non-terminal state. COMPLETED and CANCELLED are terminal — Stage F §10
// explicitly asks that invalid jumps (e.g. PENDING straight to COMPLETED)
// not be allowed without a deliberate admin action.
const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PLANNING", "CANCELLED"],
  IN_PLANNING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function getValidNextStatuses(current: BookingStatus): BookingStatus[] {
  return allowedTransitions[current];
}

export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  return allowedTransitions[from].includes(to);
}
