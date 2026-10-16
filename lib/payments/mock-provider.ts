import { randomUUID } from "crypto";
import type { PaymentProvider, CheckoutResult, VerifyResult } from "./provider";

// A genuinely working simulated checkout+verify round trip (Stage N, Phase
// B: "build and test ... with mocked provider responses without claiming
// real payments have been processed") — not a throw-stub, since there's a
// real flow to exercise in tests without real credentials. Every log line
// is unmistakably tagged so it can never be confused with a real
// transaction, the same way lib/email/send.ts's dev-mode fallback logs
// "[email:dev]".
//
// Simulated behavior: "initiating checkout" immediately records the
// transaction as verifiable-successful under a fake provider id derived
// from our own reference — verifyTransaction for that reference always
// reports success. This mirrors the shape of a real round trip (two
// separate calls, a provider-assigned id appears only after initiation)
// without needing a browser or real network.
const mockTransactions = new Map<string, { amount: number; currency: string; providerTransactionId: string }>();

export const mockPaymentProvider: PaymentProvider = {
  name: "flutterwave-mock",

  async initiateCheckout(args): Promise<CheckoutResult> {
    const providerTransactionId = `mock_${randomUUID()}`;
    mockTransactions.set(args.reference, { amount: args.amount, currency: args.currency, providerTransactionId });
    console.log(`[payment:mock] initiated checkout for reference=${args.reference} amount=${args.amount} ${args.currency} — no real payment provider is configured`);
    return { ok: true, checkoutUrl: `/portal/invoices/mock-checkout?reference=${encodeURIComponent(args.reference)}` };
  },

  async verifyTransaction(args): Promise<VerifyResult> {
    const record = args.reference ? mockTransactions.get(args.reference) : undefined;
    if (!record) {
      return { ok: false, error: "[payment:mock] unknown reference — no simulated transaction was initiated for it" };
    }
    console.log(`[payment:mock] verified reference=${args.reference} as successful — no real payment provider is configured`);
    return {
      ok: true,
      status: "successful",
      amount: record.amount,
      currency: record.currency,
      reference: args.reference,
      providerTransactionId: record.providerTransactionId,
    };
  },
};
