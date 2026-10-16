"use client";

import { useState } from "react";
import { useActionState } from "react";
import { activateClientAccount } from "./actions";
import { initialActivateState } from "./types";

export function ActivateForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(activateClientAccount, initialActivateState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="field-label" htmlFor="password">New Password</label>
        <div className="relative">
          <input
            className="field-input pr-16"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-espresso-600 hover:underline"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <p className="mt-1 text-xs text-ink/40">At least 8 characters.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="confirmPassword">Confirm Password</label>
        <input
          className="field-input"
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" className="btn-primary w-full" disabled={isPending}>
        {isPending ? "Setting up..." : "Set Password & Sign In"}
      </button>
    </form>
  );
}
