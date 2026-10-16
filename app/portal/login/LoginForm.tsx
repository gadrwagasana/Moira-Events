"use client";

import { useState } from "react";
import { useActionState } from "react";
import { loginClient } from "./actions";
import { initialClientLoginState } from "./types";

export function ClientLoginForm() {
  const [state, formAction, isPending] = useActionState(loginClient, initialClientLoginState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="email">Email</label>
        <input
          className="field-input"
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="field-label" htmlFor="password">Password</label>
          <a href="/portal/forgot-password" className="text-xs text-espresso-600 hover:underline">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <input
            className="field-input pr-16"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
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
      </div>
      {state.status === "error" && (
        <div className="text-sm text-red-600">
          <p>{state.message}</p>
          {state.unverifiedEmail && (
            <a
              href={`/portal/verify-email?email=${encodeURIComponent(state.unverifiedEmail)}`}
              className="text-espresso-600 hover:underline"
            >
              Resend verification email →
            </a>
          )}
        </div>
      )}
      <button type="submit" className="btn-primary w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </button>
      <p className="text-center text-xs text-ink/50">
        New to Moira Events?{" "}
        <a href="/portal/register" className="text-espresso-600 hover:underline">
          Create an account
        </a>{" "}
        or contact us for an invite link.
      </p>
    </form>
  );
}
