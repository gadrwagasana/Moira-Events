// CMS Phase 1 — one-time local bootstrap for the first individual admin
// account. Written and type-checked this phase, but NOT executed: the
// `Admin` table it writes to doesn't exist in the real database yet (no
// migration has been applied). Do not run this until SETUP.md's "CMS Phase
// 1" cutover sequence says the migration has been applied.
//
// Deliberately interactive (reads email/password from stdin via a prompt,
// not a CLI flag or inline env var) so the password never appears in shell
// history, process listings, or logs — "VAR=secret command" and
// "command --password=secret" both leak into shell history; an interactive
// prompt does not. The password prompt itself (@/lib/admin/hidden-input)
// fails closed if stdin isn't a real TTY, rather than falling back to
// visible, echoing input (CMS Phase 1.4).
//
// Run with: npx tsx scripts/bootstrap-admin.ts
import "dotenv/config";
import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";
import { prisma } from "@/lib/db";
import { hashAdminPassword } from "@/lib/admin/password";
import { promptHiddenInput } from "@/lib/admin/hidden-input";

async function main() {
  // Refuse to create a duplicate initial administrator — checks for ANY
  // existing admin, not just an email collision, per the explicit
  // requirement that this bootstrap a single first account, never a second.
  const existingCount = await prisma.admin.count();
  if (existingCount > 0) {
    console.error(
      `Refusing to bootstrap: ${existingCount} administrator account(s) already exist. ` +
        "This script only creates the very first admin. Use the (future) admin-management UI to add more.",
    );
    process.exitCode = 1;
    return;
  }

  const rl = createInterface({ input: stdin, output: stdout });
  let email: string;
  try {
    email = (await rl.question("First admin email: ")).trim().toLowerCase();
  } finally {
    // Closed before the password prompt below, which drives stdin manually
    // in raw mode — readline's own listener on the same stream must be
    // detached first, or the two would fight over incoming keystrokes.
    rl.close();
  }
  if (!email || !email.includes("@")) {
    console.error("A valid email is required.");
    process.exitCode = 1;
    return;
  }

  const password = await promptHiddenInput("First admin password (min 12 characters, not echoed): ");
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashAdminPassword(password);

  // Re-checked immediately before the write — narrows (does not eliminate)
  // the race between the earlier count() and this create() if the script
  // were somehow run twice concurrently. A full fix would need a
  // transaction/locking strategy that's unwarranted complexity for a
  // script meant to be run once, interactively, by a human; the remaining
  // window is the time it takes to type a password and for this one query
  // to round-trip, and only matters if someone deliberately races this
  // script against itself. Documented as an accepted residual risk, not
  // eliminated.
  const recheckCount = await prisma.admin.count();
  if (recheckCount > 0) {
    console.error("Refusing to bootstrap: another administrator account was just created. Aborting.");
    process.exitCode = 1;
    return;
  }

  const admin = await prisma.admin.create({
    data: { email, passwordHash, role: "ADMIN", isActive: true },
    select: { id: true, email: true, role: true },
  });

  console.log(`Created the first administrator: ${admin.email} (role: ${admin.role}, id: ${admin.id}).`);
  console.log("This script will refuse to run again now that an administrator exists.");
}

main()
  .catch((err) => {
    console.error("Bootstrap failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
