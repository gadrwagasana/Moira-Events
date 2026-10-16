"use client";

import { useActionState } from "react";
import { sendInvoiceEmail } from "../actions";
import { initialSendEmailFormState } from "@/lib/email/send-email-state";

export function SendInvoiceButton({ invoiceId, requestId }: { invoiceId: string; requestId: string }) {
  const action = sendInvoiceEmail.bind(null, invoiceId);
  const [state, formAction, isPending] = useActionState(action, initialSendEmailFormState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="requestId" value={requestId} />
      <button type="submit" className="btn-secondary" disabled={isPending}>
        {isPending ? "Sending..." : "Send Invoice"}
      </button>
      {state.status === "success" && <p className="text-xs text-green-700">{state.message}</p>}
      {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
    </form>
  );
}
