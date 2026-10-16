import type { PaymentProvider, CheckoutResult, VerifyResult } from "./provider";

const BASE_URL = "https://api.flutterwave.com/v3";
const TIMEOUT_MS = 15000;

// Standard/hosted checkout — researched directly against Flutterwave's own
// developer docs (not assumed): POST /v3/payments with a merchant-chosen
// tx_ref, returns a hosted checkout link to redirect the customer to.
// Nothing here ever runs inside a Prisma $transaction (Stage N Phase E).
function makeFlutterwaveProvider(secretKey: string): PaymentProvider {
  async function request(path: string, init: RequestInit) {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body };
  }

  return {
    name: "flutterwave",

    async initiateCheckout(args): Promise<CheckoutResult> {
      try {
        const { ok, body } = await request("/payments", {
          method: "POST",
          body: JSON.stringify({
            tx_ref: args.reference,
            amount: args.amount,
            currency: args.currency,
            redirect_url: args.redirectUrl,
            customer: { email: args.customerEmail, name: args.customerName },
          }),
        });
        const link = body?.data?.link;
        if (!ok || typeof link !== "string") {
          return { ok: false, error: `Flutterwave checkout initiation failed: ${body?.message ?? "unknown error"}` };
        }
        return { ok: true, checkoutUrl: link };
      } catch (err) {
        return { ok: false, error: `Flutterwave request failed: ${err instanceof Error ? err.message : "unknown error"}` };
      }
    },

    async verifyTransaction(args): Promise<VerifyResult> {
      try {
        // Prefer the provider's own numeric transaction id when we have it
        // (the documented /verify endpoint); fall back to our own
        // reference via /verify_by_reference otherwise.
        const path = args.providerTransactionId
          ? `/transactions/${encodeURIComponent(args.providerTransactionId)}/verify`
          : `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(args.reference)}`;
        const { ok, body } = await request(path, { method: "GET" });
        const data = body?.data;
        if (!ok || !data) {
          return { ok: false, error: `Flutterwave verification failed: ${body?.message ?? "unknown error"}` };
        }
        const rawStatus = String(data.status ?? "").toLowerCase();
        const status: "successful" | "failed" | "cancelled" =
          rawStatus === "successful" ? "successful" : rawStatus === "cancelled" ? "cancelled" : "failed";
        return {
          ok: true,
          status,
          amount: Number(data.amount),
          currency: String(data.currency),
          reference: String(data.tx_ref),
          providerTransactionId: String(data.id),
        };
      } catch (err) {
        return { ok: false, error: `Flutterwave request failed: ${err instanceof Error ? err.message : "unknown error"}` };
      }
    },
  };
}

export { makeFlutterwaveProvider };
