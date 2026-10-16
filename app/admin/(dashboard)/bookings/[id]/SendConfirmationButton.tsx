"use client";

import { useActionState } from "react";
import { sendBookingConfirmationEmail } from "../actions";
import { initialSendEmailFormState } from "@/lib/email/send-email-state";

export function SendConfirmationButton({ bookingId, requestId }: { bookingId: string; requestId: string }) {
  const action = sendBookingConfirmationEmail.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(action, initialSendEmailFormState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="requestId" value={requestId} />
      <button type="submit" className="btn-secondary" disabled={isPending}>
        {isPending ? "Sending..." : "Send Confirmation"}
      </button>
      {state.status === "success" && <p className="text-xs text-green-700">{state.message}</p>}
      {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
    </form>
  );
}
