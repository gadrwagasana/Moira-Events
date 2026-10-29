import { Prisma } from "@/lib/generated/prisma/client";

// Retries a single transient connection failure — the exact class this
// project has repeatedly hit against its local prisma dev instance
// (P1017 "Server has closed the connection" / "Connection terminated
// unexpectedly" / P1001 "Can't reach database server"), documented in
// SETUP.md as a known characteristic of that local tool specifically but
// also the same error class a serverless deployment's connection pool can
// surface under cold starts or pool exhaustion. Retries only these
// specific, known-transient codes — never retries a real data/constraint
// error (P2002, P2003, etc.), which would be wrong to retry (it will fail
// identically every time and only delays surfacing the real problem).
const RETRYABLE_ERROR_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);

function isRetryableError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_ERROR_CODES.has(err.code);
  }
  // DriverAdapterError-wrapped connection failures (the adapter-pg path
  // this project uses) don't always surface as a PrismaClientKnownRequestError
  // with one of the codes above — falling back to a message check for the
  // two exact strings every retryable failure in this project has produced.
  if (err instanceof Error) {
    return /Server has closed the connection|Connection terminated unexpectedly/.test(err.message);
  }
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Wraps one database operation (a single query, or a small group of
// queries you pass as one callback) with up to `retries` extra attempts on
// a transient connection failure, each with a short backoff. Intended for
// admin data loaders specifically — not Server Actions that mutate data,
// where blindly retrying a write after a connection error risks a
// duplicate side effect if the first attempt actually succeeded server-
// side before the connection dropped.
export async function withDbRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isRetryableError(err)) {
        throw err;
      }
      await sleep(150 * (attempt + 1));
    }
  }
  throw lastError;
}
