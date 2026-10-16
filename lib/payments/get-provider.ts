import type { PaymentProvider } from "./provider";
import { makeFlutterwaveProvider } from "./flutterwave";
import { mockPaymentProvider } from "./mock-provider";

// Deliberately NOT the same silent-fallback pattern as lib/email/send.ts's
// dev-mode writer. A payment silently "succeeding" via mock in production
// is categorically worse than an email silently not sending — so the mock
// refuses to activate there, rather than ever letting an unconfigured
// production deployment look like it's processing real payments.
export function getPaymentProvider(): PaymentProvider {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (secretKey) return makeFlutterwaveProvider(secretKey);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Online payments are not configured for production (FLUTTERWAVE_SECRET_KEY is not set). Refusing to fall back to the mock provider.",
    );
  }

  return mockPaymentProvider;
}
