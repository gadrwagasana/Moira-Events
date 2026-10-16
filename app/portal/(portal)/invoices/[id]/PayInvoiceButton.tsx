"use client";

import { useActionState } from "react";
import { payInvoice } from "./actions";
import { initialSendEmailFormState } from "@/lib/email/send-email-state";

export function PayInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const action = payInvoice.bind(null, invoiceId);
  const [state, formAction, isPending] = useActionState(action, initialSendEmailFormState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <button type="submit" className="btn-primary" disabled={isPending}>
        {isPending ? "Starting checkout..." : "Pay Invoice"}
      </button>
      {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
    </form>
  );
}
