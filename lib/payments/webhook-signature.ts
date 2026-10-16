import { timingSafeEqual } from "crypto";

// Flutterwave's v3 API echoes a merchant-chosen secret hash (set in the
// dashboard under Settings -> Webhooks) back in the `verif-hash` header for
// direct comparison. NOTE (stated honestly, not assumed): one secondary
// source claims v4 replaces this with an HMAC-SHA256 signature in a
// `flutterwave-signature` header instead — this could not be confirmed
// without a real merchant account. Isolated in its own function so
// swapping the mechanism later is a contained, one-function change.
export function verifyFlutterwaveWebhookSignature(headerValue: string | null): boolean {
  const secret = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secret || !headerValue) return false;

  const a = Buffer.from(headerValue);
  const b = Buffer.from(secret);
  // timingSafeEqual throws on mismatched lengths rather than returning
  // false — a plain `===` would also be a timing side-channel on the
  // secret, so neither alone is safe; check length first, then compare.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
