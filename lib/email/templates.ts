import { escapeHtml, sanitizeForSubject } from "./escape";

export function appUrl(pathAndQuery: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}${pathAndQuery}`;
}

function wrapper(bodyHtml: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #241f1c;">
      <p style="font-size: 20px; color: #5c4033; margin-bottom: 24px;">Moira Events</p>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #888;">Moira Events — Rwanda</p>
    </div>
  `;
}

export function verificationEmail(fullName: string, token: string, email: string) {
  const link = appUrl(`/portal/verify-email?token=${token}`);
  const name = escapeHtml(fullName);
  return {
    subject: "Verify your Moira Events account",
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>Thanks for creating a Moira Events client account. Please confirm this is your email address:</p>
      <p><a href="${link}" style="color:#5c4033;">Verify your email</a></p>
      <p style="font-size: 13px; color: #666;">This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
    `),
    text: `Hi ${fullName},\n\nVerify your Moira Events account (${email}): ${link}\n\nThis link expires in 24 hours. If you didn't request this, ignore this email.`,
  };
}

export function invitationEmail(fullName: string, token: string) {
  const link = appUrl(`/portal/activate?token=${token}`);
  const name = escapeHtml(fullName);
  return {
    subject: "You're invited to Moira Events",
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>You've been invited to access your event planning portal.</p>
      <p><a href="${link}" style="color:#5c4033;">Activate your account</a></p>
      <p style="font-size: 13px; color: #666;">This link expires in 7 days.</p>
    `),
    text: `Hi ${fullName},\n\nActivate your account: ${link}\n\nThis link expires in 7 days.`,
  };
}

export function passwordResetEmail(fullName: string, token: string) {
  const link = appUrl(`/portal/reset-password?token=${token}`);
  const name = escapeHtml(fullName);
  return {
    subject: "Reset your Moira Events password",
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>We received a request to reset your Moira Events password.</p>
      <p><a href="${link}" style="color:#5c4033;">Reset your password</a></p>
      <p style="font-size: 13px; color: #666;">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password will not change.</p>
    `),
    text: `Hi ${fullName},\n\nReset your password: ${link}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  };
}

// --- Stage L2 — business-document and planning-response notifications ---
// Same wrapper()/appUrl() pattern as above; all escaped; client-controlled
// strings never go into the subject line (only system-generated reference
// numbers/subjects do).

export function quoteIssuedEmail(fullName: string, quoteNumber: string, version: number, viewUrl: string) {
  const name = escapeHtml(fullName);
  return {
    subject: `Your Moira Events Quote ${quoteNumber}`,
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>Your quote (${quoteNumber}, version ${version}) is ready. It's attached as a PDF, and you can also view it anytime in your client portal:</p>
      <p><a href="${viewUrl}" style="color:#5c4033;">View your quote</a></p>
    `),
    text: `Hi ${fullName},\n\nYour quote (${quoteNumber}, version ${version}) is ready — see the attached PDF, or view it here: ${viewUrl}`,
  };
}

export function bookingConfirmationEmail(fullName: string, bookingNumber: string, eventDateFormatted: string, viewUrl: string) {
  const name = escapeHtml(fullName);
  const date = escapeHtml(eventDateFormatted);
  return {
    subject: `Booking Confirmation — ${bookingNumber}`,
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>Your booking (${bookingNumber}) for ${date} is confirmed. The confirmation is attached as a PDF, and you can also view your event details anytime in your client portal:</p>
      <p><a href="${viewUrl}" style="color:#5c4033;">View your event</a></p>
    `),
    text: `Hi ${fullName},\n\nYour booking (${bookingNumber}) for ${eventDateFormatted} is confirmed — see the attached PDF, or view it here: ${viewUrl}`,
  };
}

export function invoiceIssuedEmail(fullName: string, invoiceNumber: string, totalFormatted: string, viewUrl: string) {
  const name = escapeHtml(fullName);
  const total = escapeHtml(totalFormatted);
  return {
    subject: `Invoice ${invoiceNumber} from Moira Events`,
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>Your invoice (${invoiceNumber}, total ${total}) is attached as a PDF. You can also view it anytime in your client portal:</p>
      <p><a href="${viewUrl}" style="color:#5c4033;">View your invoice</a></p>
    `),
    text: `Hi ${fullName},\n\nYour invoice (${invoiceNumber}, total ${totalFormatted}) is ready — see the attached PDF, or view it here: ${viewUrl}`,
  };
}

export function planningResponseEmail(fullName: string, subject: string, viewUrl: string) {
  const name = escapeHtml(fullName);
  const subjectLine = escapeHtml(subject);
  // `subject` is the client's own PlanningRequest.subject — client-controlled,
  // unlike every other template's subject line (quote/invoice/booking numbers
  // are system-generated). Sanitize separately for the header vs. the body.
  const safeSubject = sanitizeForSubject(subject);
  return {
    subject: `New reply on your planning request: ${safeSubject}`,
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>The Moira Events team has replied to your planning request "${subjectLine}":</p>
      <p><a href="${viewUrl}" style="color:#5c4033;">View the conversation</a></p>
    `),
    text: `Hi ${fullName},\n\nThe Moira Events team has replied to your planning request "${subject}": ${viewUrl}`,
  };
}
