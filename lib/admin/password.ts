import { hash, verify } from "@node-rs/argon2";

// @node-rs/argon2 exports `Algorithm` as a `const enum`, which TypeScript
// cannot access as a value under Next.js's `isolatedModules` compilation
// (each file is type-checked/transpiled independently, and const enums
// require whole-program inlining) — confirmed by this failing `next build`
// with TS2748 when `Algorithm.Argon2id` was imported and used directly.
// Using the documented raw value instead (Argon2id = 2, per
// node_modules/@node-rs/argon2/index.d.ts) avoids importing the enum at
// all; TypeScript's numeric-enum compatibility rules still accept a plain
// number literal here.
const ARGON2ID = 2;

// CMS Phase 1.2 — Argon2id, replacing Phase 1's original Node-built-in
// scrypt implementation, per explicit owner decision: this hashes the
// single highest-privilege credential in the app, and Argon2id is OWASP's
// current recommended password-hashing algorithm, purpose-built for this
// (unlike scrypt, which is a general-purpose KDF this project happened to
// already have available via Node's crypto module). The scrypt version
// also had a real, caught-by-testing bug (an invalid `maxmem` that threw on
// every call) — exactly the class of self-inflicted error a dedicated
// library's own validated defaults avoid.
//
// Library choice: @node-rs/argon2 (napi-rs/Rust bindings) over the older
// `argon2` npm package (native C bindings via node-gyp). The napi-rs
// package ships prebuilt binaries per platform as optionalDependencies, so
// a plain `npm install` needs no C compiler at install time — lower-risk
// for a Vercel build than a node-gyp compile step. Confirmed locally:
// @node-rs/argon2-win32-x64-msvc installed and `hash`/`verify` ran
// successfully on this machine. NOT verified against Vercel's actual Linux
// build/runtime — see SETUP.md ("CMS Phase 1.2") for that documented
// limitation.
//
// hash() returns a single self-describing PHC-format string
// ($argon2id$v=19$m=...,t=...,p=...$<salt>$<hash>, both salt and hash
// base64) — the library generates its own cryptographically random salt
// internally and encodes it (and every parameter) into that string, so
// verify() can re-derive the correct hash from the password alone with no
// separate salt/params storage needed. Each call to hash() therefore
// produces a different string for the same password, the same guarantee
// the previous random-salt-per-hash scrypt implementation made.
//
// Parameters deliberately exceed the library's own defaults (m=19456 KiB,
// t=2, p=1 — already OWASP's first recommended Argon2id configuration),
// consistent with the "more expensive than default, because this is the
// most sensitive credential in the app" philosophy the scrypt version
// stated. Measured locally at ~125ms per hash — negligible for an
// infrequent admin login, deliberately costly for an offline attacker.
const ADMIN_ARGON2_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 1,
} as const;

export async function hashAdminPassword(password: string): Promise<string> {
  return hash(password, ADMIN_ARGON2_OPTIONS);
}

// CMS Phase 2 — a precomputed Argon2id hash of a fixed, arbitrary string
// that is NOT any real account's password. Used by the login action to run
// verifyAdminPassword() against *something* with the same cost parameters
// even when the submitted email doesn't match any admin, so a failed login
// takes the same ~125ms either way. Without this, "unknown email" would
// return near-instantly (no hash to verify) while "wrong password for a
// real email" would take ~125ms — an email-enumeration timing side channel
// the old single-shared-password system couldn't have, since it had no
// concept of email at all. This string is not a secret: it protects
// nothing by being kept hidden, only by always being run through the same
// expensive comparison as a real stored hash.
export const DECOY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=1$r9J7fFsgck7rhqR9jKr0yw$tdjzcd4083DTAFkJR05mLZZ+ezNDyImdTmh0KRkgHMw";

export async function verifyAdminPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  try {
    // verify() parses the algorithm/version/m/t/p/salt it needs out of
    // `stored`'s own PHC-format header — it does not take ADMIN_ARGON2_OPTIONS,
    // so a future parameter change here never invalidates existing hashes;
    // old hashes keep verifying against whatever parameters they were
    // actually created with. The comparison itself is constant-time,
    // performed inside the library's native implementation, not by any
    // code in this file.
    return await verify(stored, password);
  } catch {
    // Confirmed by direct testing: verify() throws ("Decoding failed")
    // rather than returning false when `stored` isn't a well-formed PHC
    // hash string (e.g. empty, truncated, or leftover scrypt-format data
    // from before this change) — treated as "does not match," not an
    // unhandled error, the same defensive behavior the previous scrypt
    // implementation had for a malformed stored value.
    return false;
  }
}
