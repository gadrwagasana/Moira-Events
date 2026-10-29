"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { TaskStatus, TaskPriority } from "@/lib/generated/prisma/client";
import { isValidTransition } from "@/lib/tasks/transitions";
import { requireAdminRole } from "@/lib/admin/auth";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.preprocess(emptyToUndefined, z.string().optional()),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.preprocess(emptyToUndefined, z.string().optional()),
  assignedTo: z.preprocess(emptyToUndefined, z.string().optional()),
  clientVisible: z.preprocess((v) => v === "on" || v === "true", z.boolean()).default(false),
});

export async function createTask(bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  await prisma.task.create({
    data: {
      bookingId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assignedTo: data.assignedTo,
      clientVisible: data.clientVisible,
      createdBy: "admin",
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/tasks");
}

export async function updateTask(taskId: string, bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const data = parsed.data;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assignedTo: data.assignedTo,
      clientVisible: data.clientVisible,
      updatedBy: "admin",
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/tasks");
}

const statusSchema = z.object({ status: z.nativeEnum(TaskStatus) });

// Transition-validated (§11 — no arbitrary status strings). completedAt is
// managed here, alongside status, rather than as a separately invented rule.
export async function updateTaskStatus(taskId: string, bookingId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  if (!isValidTransition(task.status, parsed.data.status)) return;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: parsed.data.status,
      completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
      updatedBy: "admin",
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/tasks");
}

// Deletion is blocked once a task leaves TODO (§34) — abandon via CANCELLED
// instead, which preserves history.
export async function deleteTask(taskId: string, bookingId: string) {
  await requireAdminRole("ADMIN");
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  if (task.status !== "TODO") return;

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/tasks");
}
