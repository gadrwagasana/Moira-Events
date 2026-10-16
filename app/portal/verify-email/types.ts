export type ResendState = { status: "idle" | "sent" | "error"; message?: string };
export const initialResendState: ResendState = { status: "idle" };
