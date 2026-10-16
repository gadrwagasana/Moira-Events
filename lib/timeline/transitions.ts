import { EventTimelineStatus } from "@/lib/generated/prisma/client";

const allowedTransitions: Record<EventTimelineStatus, EventTimelineStatus[]> = {
  PLANNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED", "PLANNED"],
  COMPLETED: ["IN_PROGRESS"],
  CANCELLED: [],
};

export function getValidNextStatuses(current: EventTimelineStatus): EventTimelineStatus[] {
  return allowedTransitions[current];
}

export function isValidTransition(from: EventTimelineStatus, to: EventTimelineStatus): boolean {
  return allowedTransitions[from].includes(to);
}
