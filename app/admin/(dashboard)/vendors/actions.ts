"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/auth";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.preprocess(emptyToUndefined, z.string().optional()),
  description: z.preprocess(emptyToUndefined, z.string().optional()),
  contactName: z.preprocess(emptyToUndefined, z.string().optional()),
  email: z.preprocess(emptyToUndefined, z.string().email().optional()),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  website: z.preprocess(emptyToUndefined, z.string().optional()),
  address: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

export async function createVendor(formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = vendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const vendor = await prisma.vendorRecommendation.create({ data: { ...parsed.data, createdBy: "admin" } });

  revalidatePath("/admin/vendors");
  redirect(`/admin/vendors/${vendor.id}`);
}

export async function updateVendor(vendorId: string, formData: FormData) {
  await requireAdminRole("ADMIN");
  const parsed = vendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await prisma.vendorRecommendation.update({ where: { id: vendorId }, data: { ...parsed.data, updatedBy: "admin" } });

  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin/vendors");
}

// Archive/reactivate only — a recommendation is never hard-deleted once it
// may be linked to historical bookings (§13/§21).
export async function setVendorActive(vendorId: string, active: boolean) {
  await requireAdminRole("ADMIN");
  await prisma.vendorRecommendation.update({ where: { id: vendorId }, data: { active, updatedBy: "admin" } });

  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin/vendors");
}
