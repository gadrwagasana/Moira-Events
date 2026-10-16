import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Create Account — Moira Events Client Portal" };

export default function PortalRegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-100 px-6 py-12">
      <div className="w-full max-w-sm rounded-xl border border-espresso-100 bg-ivory-50 p-8">
        <h1 className="mb-1 text-center font-serif text-2xl text-espresso-700">Moira Events</h1>
        <p className="mb-6 text-center text-sm text-ink/60">Create Your Client Portal Account</p>
        <RegisterForm />
      </div>
    </div>
  );
}
