import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { escapeHtml } from "./escape";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: Buffer }[];
};

export type SendResult = { ok: true; providerMessageId?: string } | { ok: false; error: string };

// Dev-mode fallback: no RESEND_API_KEY configured. Writes a readable .html
// file and logs its path — so a "sent" email can actually be opened during
// development. This is also what stands in for "no real email sent" in this
// project's direct-script test methodology (no test framework is wired up;
// every prior stage verifies via npx tsx scratch-verify-*.ts).
async function sendEmailDev(message: EmailMessage): Promise<SendResult> {
  const dir = path.join(process.cwd(), ".local-emails");
  await mkdir(dir, { recursive: true });

  const safeTo = message.to.replace(/[^a-zA-Z0-9@._-]/g, "_");
  const filename = `${Date.now()}-${safeTo}.html`;
  const filePath = path.join(dir, filename);

  // The preview wrapper is separate from message.html (which the caller is
  // responsible for escaping) — this wrapper has its own untrusted
  // interpolations (to, subject, attachment filenames) that need the same
  // treatment, or a subject/recipient containing HTML would corrupt this
  // dev-only preview file's own markup.
  const attachmentNote = message.attachments?.length
    ? `<p><strong>Attachments:</strong> ${message.attachments.map((a) => escapeHtml(a.filename)).join(", ")}</p>`
    : "";

  await writeFile(
    filePath,
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(message.subject)}</title></head><body>` +
      `<p><strong>To:</strong> ${escapeHtml(message.to)}</p><p><strong>Subject:</strong> ${escapeHtml(message.subject)}</p>${attachmentNote}<hr>${message.html}</body></html>`,
    "utf-8",
  );

  console.log(`[email:dev] "${message.subject}" to ${message.to} — saved to ${filePath}`);
  return { ok: true };
}

async function sendEmailResend(message: EmailMessage, apiKey: string): Promise<SendResult> {
  // Lazy import: only pulled in when a real API key is configured, so dev
  // environments without one never touch the network.
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM_ADDRESS ?? "Moira Events <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    attachments: message.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });

  if (error) {
    // Sanitized: the SDK's ErrorResponse never includes the message body or
    // recipient secrets, only a provider-side error code/message — safe to
    // surface as-is, but still never logged alongside tokens/passwords.
    return { ok: false, error: `${error.name}: ${error.message}` };
  }
  return { ok: true, providerMessageId: data.id };
}

// Provider-agnostic interface — callers never know or care which branch
// ran. Swapping providers later (Postmark, SES, etc.) only touches this
// file; no call site changes.
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return sendEmailDev(message);

  try {
    return await sendEmailResend(message, apiKey);
  } catch (err) {
    // Network/timeout/unexpected-throw from the SDK — never let a provider
    // failure escape as an uncaught exception; always resolve to a result.
    const reason = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Provider request failed: ${reason}` };
  }
}
