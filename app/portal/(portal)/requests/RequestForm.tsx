"use client";

import { useActionState } from "react";
import { createPlanningRequest, initialRequestFormState } from "./actions";

export function RequestForm() {
  const [state, formAction, isPending] = useActionState(createPlanningRequest, initialRequestFormState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="field-label">Subject</label>
        <input className="field-input" name="subject" required maxLength={200} placeholder="e.g. Reception Start Time" />
      </div>
      <div>
        <label className="field-label">Message</label>
        <textarea
          className="field-input"
          name="message"
          rows={4}
          required
          maxLength={5000}
          placeholder="e.g. Would it be possible to move the reception start time from 18:00 to 19:00?"
        />
      </div>
      <div>
        <label className="field-label">Priority</label>
        <select className="field-input w-auto" name="priority" defaultValue="MEDIUM">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit Planning Request"}
      </button>
    </form>
  );
}
