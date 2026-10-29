import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/admin/auth";
import { NewPageForm } from "./NewPageForm";

export const metadata: Metadata = { title: "New Page — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCmsNewPagePage() {
  await requireAdminRole("EDITOR");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-serif text-2xl text-espresso-700">New Page</h1>
      <NewPageForm />
    </div>
  );
}
