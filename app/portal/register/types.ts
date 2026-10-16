export type RegisterState = { status: "idle" | "error"; message?: string };
export const initialRegisterState: RegisterState = { status: "idle" };
