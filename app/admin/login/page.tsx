import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Staff Login — Moira Events" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-100 px-6">
      <div className="w-full max-w-sm rounded-xl border border-espresso-100 bg-ivory-50 p-8">
        <div className="mb-6 flex justify-center">
          <Logo className="h-14 w-auto" />
        </div>
        <h1 className="mb-1 text-center font-serif text-lg text-espresso-700">Moira Events Staff Portal</h1>
        <p className="mb-6 text-center text-xs text-ink/50">Internal use only — Moira Events team members</p>
        <LoginForm />
      </div>
    </div>
  );
}
