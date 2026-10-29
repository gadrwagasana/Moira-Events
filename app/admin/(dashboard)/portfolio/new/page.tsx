import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/admin/auth";
import { PortfolioItemForm } from "../PortfolioItemForm";

export const metadata: Metadata = { title: "New Portfolio Item — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminNewPortfolioItemPage() {
  await requireAdminRole("EDITOR");

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-serif text-2xl text-espresso-700">New Portfolio Item</h1>
      <PortfolioItemForm />
    </div>
  );
}
