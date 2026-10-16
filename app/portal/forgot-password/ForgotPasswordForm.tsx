"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "./actions";
import { initialForgotPasswordState } from "./types";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialForgotPasswordState);

  if (state.status === "sent") {
    return <p className="text-sm text-green-700">{state.message}</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="email">Email</label>
        <input className="field-input" id="email" name="email" type="email" required autoFocus autoCapitalize="off" autoCorrect="off" />
      </div>
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" className="btn-primary w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}
