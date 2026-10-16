"use client";

import { useState } from "react";
import { useActionState } from "react";
import { registerClient } from "./actions";
import { initialRegisterState } from "./types";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerClient, initialRegisterState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="fullName">Full Name</label>
        <input className="field-input" id="fullName" name="fullName" required autoFocus />
      </div>
      <div>
        <label className="field-label" htmlFor="email">Email</label>
        <input className="field-input" id="email" name="email" type="email" required autoCapitalize="off" autoCorrect="off" />
      </div>
      <div>
        <label className="field-label" htmlFor="phone">Phone <span className="text-xs text-ink/40">(optional)</span></label>
        <input className="field-input" id="phone" name="phone" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <div className="relative">
          <input
            className="field-input pr-16"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            minLength={8}
            required
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
          minLength={8}
          required
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" className="btn-primary w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Create Account"}
      </button>
      <p className="text-center text-xs text-ink/50">
        Already have an account? <a href="/portal/login" className="text-espresso-600 hover:underline">Sign in</a>
      </p>
    </form>
  );
}
