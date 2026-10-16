import { PlanningRequestStatus } from "@/lib/generated/prisma/client";

const allowedTransitions: Record<PlanningRequestStatus, PlanningRequestStatus[]> = {
  OPEN: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["RESPONDED", "CANCELLED"],
  RESPONDED: ["IN_REVIEW", "RESOLVED", "CANCELLED"],
  RESOLVED: [],
  CANCELLED: [],
};

export function getValidNextStatuses(current: PlanningRequestStatus): PlanningRequestStatus[] {
  return allowedTransitions[current];
}

export function isValidTransition(from: PlanningRequestStatus, to: PlanningRequestStatus): boolean {
  return allowedTransitions[from].includes(to);
}
