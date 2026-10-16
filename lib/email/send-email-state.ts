// Deliberately its own file with zero server-only imports (no prisma, no
// sendEmail) — the 3 admin "Send" button client components import this
// directly. Importing it from lib/email/outbox.ts instead would drag that
// file's own prisma/pg imports into the browser bundle (Node-only modules
// like `tls` have no browser equivalent and fail to build).
export type SendEmailFormState = { status: "idle" | "error" | "success"; message?: string };
export const initialSendEmailFormState: SendEmailFormState = { status: "idle" };
