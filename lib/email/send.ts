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

// Sends through the owner's actual moiraevents27@gmail.com account via
// Gmail's own SMTP, authenticated with an "App Password" (not the account's
// real login password — Google requires a separate 16-character app
// password for SMTP auth once 2-Step Verification is on, and no longer
// allows plain-password SMTP login at all for most accounts). This makes
// the Gmail address the genuine, authenticated sender — unlike Resend's
// free tier, which cannot send "from" a @gmail.com address at all, since
// nobody can verify domain ownership of gmail.com itself.
//
// Known limits, documented rather than silently assumed away: Gmail SMTP
// caps outgoing mail at roughly 500 messages/day per account, and is not
// designed for high-volume transactional sending — acceptable for this
// app's current scale, but something to revisit (a verified custom domain
// through Resend/SES/etc.) if volume grows.
async function sendEmailGmail(message: EmailMessage, gmailUser: string, appPassword: string): Promise<SendResult> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: appPassword },
  });

  const from = process.env.EMAIL_FROM_ADDRESS ?? `Moira Events <${gmailUser}>`;

  try {
    const info = await transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
    });
    return { ok: true, providerMessageId: info.messageId };
  } catch (err) {
    // Same "never let a provider failure escape as an uncaught exception"
    // rule as the Resend branch — a bad/expired app password, Gmail rate
    // limiting, or a network blip all resolve to a result, not a throw.
    const reason = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Gmail SMTP request failed: ${reason}` };
  }
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
//
// Precedence when more than one is configured: Resend first (a dedicated
// transactional-email provider, the better fit if a verified domain exists),
// then Gmail SMTP (the owner's own moiraevents27@gmail.com account — the
// configured path as of this change), then the local dev-file fallback.
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      return await sendEmailResend(message, apiKey);
    } catch (err) {
      // Network/timeout/unexpected-throw from the SDK — never let a
      // provider failure escape as an uncaught exception.
      const reason = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: `Provider request failed: ${reason}` };
    }
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailAppPassword) {
    return sendEmailGmail(message, gmailUser, gmailAppPassword);
  }

  // sendEmailDev writes to the local filesystem (.local-emails/) — a
  // convenience for local development only. Vercel's production serverless
  // functions have a read-only filesystem outside /tmp, so that write
  // throws there with no caller expecting an exception from a "send an
  // email" call. Confirmed in production: this crashed registerClient()
  // (and would crash every other email-sending action) with an uncaught
  // error whenever no provider was configured, surfaced to the client only
  // as Next's generic "A server error occurred" page. Same "refuse safely
  // rather than silently misbehave in production" philosophy already used
  // for the mock payment provider.
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[email] No email provider configured in production (RESEND_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD) — refusing to send rather than falling back to the local dev-file writer, which cannot work on a read-only production filesystem.",
    );
    return { ok: false, error: "Email delivery is not configured for this environment." };
  }
  return sendEmailDev(message);
}
