export type ResetPasswordState = { status: "idle" | "error"; message?: string };
export const initialResetPasswordState: ResetPasswordState = { status: "idle" };
