"use client";

import { useActionState } from "react";
import { resendVerificationEmail } from "./actions";
import { initialResendState } from "./types";

export function ResendForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(resendVerificationEmail, initialResendState);

  return (
    <form action={formAction} className="mt-6 space-y-3">
      <input type="hidden" name="email" value={email} />
      {state.status === "sent" && <p className="text-sm text-green-700">{state.message}</p>}
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" className="btn-secondary w-full" disabled={isPending || !email}>
        {isPending ? "Sending..." : "Resend verification email"}
      </button>
    </form>
  );
}
