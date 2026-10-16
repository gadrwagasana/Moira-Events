// Provider-agnostic interface — a second provider can be added later
// without touching invoice/payment business logic (Stage N, Phase B).
// Kept deliberately small: only the operations the checkout+verification
// flow actually needs.

export type CheckoutResult = { ok: true; checkoutUrl: string } | { ok: false; error: string };

export type VerifyResult =
  | {
      ok: true;
      status: "successful" | "failed" | "cancelled";
      amount: number;
      currency: string;
      reference: string;
      providerTransactionId: string;
    }
  | { ok: false; error: string };

export interface PaymentProvider {
  name: string;
  initiateCheckout(args: {
    reference: string;
    amount: number;
    currency: string;
    customerEmail: string;
    customerName: string;
    redirectUrl: string;
  }): Promise<CheckoutResult>;
  // Either providerTransactionId or reference is enough to look a
  // transaction up — callers pass whichever they have (the return-page
  // query params may carry both; the webhook payload carries the
  // provider's own id).
  verifyTransaction(args: { providerTransactionId?: string; reference: string }): Promise<VerifyResult>;
}
