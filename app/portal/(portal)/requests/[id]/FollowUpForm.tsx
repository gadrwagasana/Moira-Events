"use client";

import { useActionState } from "react";
import { addClientFollowUpMessage, initialFollowUpFormState } from "../actions";

export function FollowUpForm({ requestId }: { requestId: string }) {
  const action = addClientFollowUpMessage.bind(null, requestId);
  const [state, formAction, isPending] = useActionState(action, initialFollowUpFormState);

  return (
    <form action={formAction} className="mt-6 space-y-2 border-t border-espresso-100 pt-4">
      <label className="field-label">Add a Follow-Up</label>
      <textarea className="field-input" name="message" rows={3} required maxLength={5000} placeholder="Write a message..." />
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
