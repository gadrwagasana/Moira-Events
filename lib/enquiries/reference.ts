// Shared reference-number scheme across every submission type, so a client
// can always tell at a glance (and support staff can search by) what kind of
// document a reference number belongs to:
//   MW = Wedding, MP = Party, MC = Corporate, MG = General (Contact page),
//   MV = Consultation request (Visit), MQ = Quote, MB = Booking, MI = Invoice,
//   MR = online payment Receipt (Stage N — "MP" was already Party).
export type ReferencePrefix = "MW" | "MP" | "MC" | "MG" | "MV" | "MQ" | "MB" | "MI" | "MR";

export function generateReferenceNumber(prefix: ReferencePrefix): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${y}${m}${d}-${rand}`;
}
