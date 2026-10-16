import { randomBytes, createHash } from "crypto";

// Tokens (invite/verification/reset) are high-entropy random values, unlike
// passwords — a fast deterministic hash is the correct choice here (not
// scrypt), because verifying an incoming token means re-hashing it the same
// way and looking it up by exact match.
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
