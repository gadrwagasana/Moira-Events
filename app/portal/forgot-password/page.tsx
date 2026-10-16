import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot Password — Moira Events Client Portal" };

export default function PortalForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-100 px-6">
      <div className="w-full max-w-sm rounded-xl border border-espresso-100 bg-ivory-50 p-8">
        <h1 className="mb-1 text-center font-serif text-2xl text-espresso-700">Moira Events</h1>
        <p className="mb-6 text-center text-sm text-ink/60">Reset Your Password</p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-xs text-ink/40">
          <a href="/portal/login" className="hover:underline">Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
