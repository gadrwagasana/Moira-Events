"use client";

import { useState } from "react";
import { useActionState } from "react";
import { login } from "./actions";
import { initialLoginState } from "./types";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialLoginState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <div className="relative">
          <input
            className="field-input pr-16"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
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
      </div>
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" className="btn-primary w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
