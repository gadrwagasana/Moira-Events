"use client";

import { useActionState } from "react";
import { updateClientProfile, initialProfileFormState } from "./actions";

type Props = {
  fullName: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
};

export function ProfileForm({ fullName, email, phone, whatsapp }: Props) {
  const [state, formAction, isPending] = useActionState(updateClientProfile, initialProfileFormState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="fullName">Full Name</label>
          <input className="field-input" id="fullName" name="fullName" defaultValue={fullName} required />
        </div>
        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input className="field-input" id="email" name="email" type="email" defaultValue={email} required />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">Phone</label>
          <input className="field-input" id="phone" name="phone" defaultValue={phone ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="whatsapp">WhatsApp</label>
          <input className="field-input" id="whatsapp" name="whatsapp" defaultValue={whatsapp ?? ""} />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="currentPassword">
          Current Password <span className="text-xs text-ink/40">(required to save changes)</span>
        </label>
        <input className="field-input" id="currentPassword" name="currentPassword" type="password" required />
      </div>
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      {state.status === "success" && <p className="text-sm text-green-700">{state.message}</p>}
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
