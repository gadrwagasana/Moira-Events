"use client";

import { useState } from "react";
import { useActionState } from "react";
import { changeClientPassword, initialProfileFormState } from "./actions";

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changeClientPassword, initialProfileFormState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="currentPassword">Current Password</label>
        <input
          className="field-input"
          id="currentPassword"
          name="currentPassword"
          type={showPassword ? "text" : "password"}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="newPassword">New Password</label>
          <input
            className="field-input"
            id="newPassword"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="confirmPassword">Confirm New Password</label>
          <input
            className="field-input"
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            minLength={8}
            required
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-ink/50">
        <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
        Show passwords
      </label>
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      {state.status === "success" && <p className="text-sm text-green-700">{state.message}</p>}
      <button type="submit" className="btn-secondary" disabled={isPending}>
        {isPending ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
}
