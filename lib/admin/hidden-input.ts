import { stdin, stdout } from "process";

// CMS Phase 1.4 — extracted out of scripts/bootstrap-admin.ts so this
// prompt logic can be unit-tested (scripts/verify-cms-phase1-security.ts)
// without executing the bootstrap script itself (which touches the
// database as its very first statement). No database or Next.js import of
// any kind in this file.
export class NonInteractiveStdinError extends Error {
  constructor() {
    super(
      "Refusing to read a password from non-interactive stdin (no TTY) — plain " +
        "readline input would echo it in plaintext with no way to suppress that. " +
        "Run this script directly in an interactive terminal, not piped or " +
        "redirected.",
    );
    this.name = "NonInteractiveStdinError";
  }
}

// Reads one line from stdin without echoing it — used for the admin
// bootstrap password prompt so it never appears on screen, in terminal
// scrollback, or in a screen recording.
//
// FAILS CLOSED (CMS Phase 1.4, fixing a Phase 1.1 gap): a prior version of
// this function silently fell back to ordinary, echoing input whenever
// stdin wasn't a real TTY (e.g. piped/redirected input). That's exactly the
// failure mode a hidden-input prompt exists to prevent — a non-interactive
// caller could end up with the password visible in whatever captured that
// output. This version refuses outright instead, before writing the
// question or reading anything.
export async function promptHiddenInput(question: string): Promise<string> {
  if (!stdin.isTTY) {
    throw new NonInteractiveStdinError();
  }

  stdout.write(question);
  return new Promise((resolve) => {
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let input = "";
    const onData = (char: string) => {
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004": // Ctrl-D
          stdin.removeListener("data", onData);
          stdin.setRawMode(Boolean(wasRaw));
          stdout.write("\n");
          resolve(input);
          break;
        case "\u0003": // Ctrl-C — exit rather than silently continuing with a partial password.
          stdout.write("\n");
          process.exit(130);
          break;
        case "\u007f": // backspace (DEL)
        case "\b":
          input = input.slice(0, -1);
          break;
        default:
          input += char;
          break;
      }
    };
    stdin.on("data", onData);
  });
}
