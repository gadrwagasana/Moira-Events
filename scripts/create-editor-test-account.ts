// Phase E/F acceptance testing — creates ONE additional local Admin row
// with role EDITOR, for manually testing the EDITOR-vs-ADMIN permission
// split in a real browser session. Deliberately separate from
// scripts/bootstrap-admin.ts, not a variant of it: that script refuses to
// run at all once any administrator exists (by design — it only ever
// creates the first account) and has no role parameter of any kind — it
// hardcodes role: "ADMIN". This script is narrowly scoped to the one thing
// explicitly authorized: adding a single EDITOR-role test account alongside
// an existing ADMIN, reusing the same hashing/hidden-input utilities
// bootstrap-admin.ts uses, with role hardcoded to "EDITOR" (not a prompt or
// CLI flag) so this script cannot be used to create or escalate anything
// other than exactly that.
//
// Interactive only — promptHiddenInput fails closed on non-TTY stdin, so
// this must be run directly in your own terminal, the same as
// bootstrap-admin.ts. The password is never echoed, logged, or sent
// anywhere by this script.
//
// Run with: npx tsx scripts/create-editor-test-account.ts
import "dotenv/config";
import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";
import { prisma } from "@/lib/db";
import { hashAdminPassword } from "@/lib/admin/password";
import { promptHiddenInput } from "@/lib/admin/hidden-input";

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  let email: string;
  try {
    email = (await rl.question("EDITOR test account email: ")).trim().toLowerCase();
  } finally {
    rl.close();
  }
  if (!email || !email.includes("@")) {
    console.error("A valid email is required.");
    process.exitCode = 1;
    return;
  }

  // Ordinary uniqueness check, not bootstrap-admin.ts's "refuse if ANY
  // admin exists" — this script is meant to run alongside an existing
  // ADMIN account, so only an exact email collision is refused.
  const existing = await prisma.admin.findUnique({ where: { email }, select: { id: true, role: true } });
  if (existing) {
    console.error(`Refusing: an account with this email already exists (role: ${existing.role}).`);
    process.exitCode = 1;
    return;
  }

  const password = await promptHiddenInput("EDITOR test account password (min 12 characters, not echoed): ");
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashAdminPassword(password);

  const admin = await prisma.admin.create({
    data: { email, passwordHash, role: "EDITOR", isActive: true },
    select: { id: true, email: true, role: true },
  });

  console.log(`Created EDITOR test account: ${admin.email} (role: ${admin.role}, id: ${admin.id}).`);
  console.log("Use this account only for local acceptance testing.");
}

main()
  .catch((err) => {
    console.error("Failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
