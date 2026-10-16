export type ClientLoginState = { status: "idle" | "error"; message?: string; unverifiedEmail?: string };
export const initialClientLoginState: ClientLoginState = { status: "idle" };
