// Ad-hoc local utility to reset an existing administrator's password when
// forgotten/mistyped. Mirrors scripts/bootstrap-admin.ts's safety pattern
// exactly: hidden, non-echoing password input that fails closed on a
// non-interactive terminal, Argon2id hashing, no password or hash ever
// logged. Updates ONLY the passwordHash field for the matched admin — does
// not touch role, isActive, or any other record.
//
// Run with: npx tsx scripts/reset-admin-password.ts
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
    email = (await rl.question("Admin email to reset: ")).trim().toLowerCase();
  } finally {
    rl.close();
  }
  if (!email || !email.includes("@")) {
    console.error("A valid email is required.");
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (!existing) {
    console.error(`No administrator found with email ${email}.`);
    process.exitCode = 1;
    return;
  }

  const password = await promptHiddenInput("New password (min 12 characters, not echoed): ");
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashAdminPassword(password);
  await prisma.admin.update({ where: { email }, data: { passwordHash } });

  console.log(`Password updated for ${email}. Nothing else about the account changed.`);
}

main()
  .catch((err) => {
    console.error("Reset failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
