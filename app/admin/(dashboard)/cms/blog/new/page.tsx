import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/admin/auth";
import { NewBlogPostForm } from "./NewBlogPostForm";

export const metadata: Metadata = { title: "New Blog Post — Moira Events Admin" };
export const dynamic = "force-dynamic";

export default async function AdminNewBlogPostPage() {
  await requireAdminRole("EDITOR");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-serif text-2xl text-espresso-700">New Blog Post</h1>
      <NewBlogPostForm />
    </div>
  );
}
