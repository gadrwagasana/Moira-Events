import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

// crypto.scrypt — built into Node, no new dependency, same "use the
// platform's crypto module" approach already used for admin session signing
// (lib/admin/session.ts). Stored as "salt:hash", both hex.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const expectedBuf = Buffer.from(hash, "hex");
  if (expectedBuf.length !== derivedKey.length) return false;
  return timingSafeEqual(expectedBuf, derivedKey);
}
