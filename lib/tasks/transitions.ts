import { TaskStatus } from "@/lib/generated/prisma/client";

const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["TODO", "COMPLETED", "CANCELLED"],
  COMPLETED: ["IN_PROGRESS"],
  CANCELLED: [],
};

export function getValidNextStatuses(current: TaskStatus): TaskStatus[] {
  return allowedTransitions[current];
}

export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  return allowedTransitions[from].includes(to);
}
