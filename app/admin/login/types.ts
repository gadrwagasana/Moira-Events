export type LoginState = { status: "idle" | "error"; message?: string };
export const initialLoginState: LoginState = { status: "idle" };
