import { ConsultationStatus } from "@/lib/generated/prisma/client";

const allowedTransitions: Record<ConsultationStatus, ConsultationStatus[]> = {
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function getValidNextStatuses(current: ConsultationStatus): ConsultationStatus[] {
  return allowedTransitions[current];
}

export function isValidTransition(from: ConsultationStatus, to: ConsultationStatus): boolean {
  return allowedTransitions[from].includes(to);
}
