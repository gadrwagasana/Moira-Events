import { NextResponse } from "next/server";
import { verifyFlutterwaveWebhookSignature } from "@/lib/payments/webhook-signature";
import { getPaymentProvider } from "@/lib/payments/get-provider";
import { applyVerifiedPaymentOutcome } from "@/lib/payments/apply-verified-outcome";
import { recordAuditEvent } from "@/lib/audit/log";

// Public endpoint by necessity (Flutterwave calls it directly) — never
// trusted without the signature check below. The body itself is never
// stored raw anywhere (not in Payment.notes, not in any audit summary) —
// only minimal diagnostic fields derived from it.
export async function POST(request: Request) {
  const signatureHeader = request.headers.get("verif-hash");

  if (!verifyFlutterwaveWebhookSignature(signatureHeader)) {
    await recordAuditEvent({
      actorType: "SYSTEM",
      actorId: "system",
      action: "payment.online_webhook_rejected",
      entityType: "Payment",
      entityId: "unknown",
      outcome: "FAILURE",
      summary: "Webhook rejected — missing or invalid verif-hash signature",
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const providerTransactionId = body?.data?.id ? String(body.data.id) : undefined;
  const reference = body?.data?.tx_ref ? String(body.data.tx_ref) : undefined;

  if (!reference) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // Always re-verify with the provider directly — the webhook payload
  // itself is never treated as proof, only as a pointer to what to check
  // (Stage N Phase E). This network call happens here, outside any
  // $transaction (applyVerifiedPaymentOutcome's own DB writes are short).
  const provider = getPaymentProvider();
  const verified = await provider.verifyTransaction({ providerTransactionId, reference });
  await applyVerifiedPaymentOutcome(verified, "webhook", reference);

  // verified.ok === false means OUR OWN call to Flutterwave's verify
  // endpoint failed (network error/timeout) — it is not a provider-confirmed
  // outcome, so applyVerifiedPaymentOutcome deliberately left the Payment
  // row untouched. Returning 200 here would suppress Flutterwave's own
  // webhook-retry mechanism, the one safety net for this exact situation —
  // there is no other job in this app that re-verifies a stuck transaction
  // (Stage P audit finding). A non-2xx here asks Flutterwave to retry.
  if (!verified.ok) {
    return new NextResponse("Verification temporarily unavailable", { status: 503 });
  }

  // Every other branch inside applyVerifiedPaymentOutcome (unknown
  // reference, mismatch, duplicate, conflicting-but-ignored, or a real
  // apply) is a provider-CONFIRMED outcome and a safe no-op or
  // correctly-applied state change — nothing left to retry.
  return new NextResponse("OK", { status: 200 });
}
