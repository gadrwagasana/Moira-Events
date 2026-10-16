export type ForgotPasswordState = { status: "idle" | "sent" | "error"; message?: string };
export const initialForgotPasswordState: ForgotPasswordState = { status: "idle" };
