export type ContactState = {
  status: "idle" | "error" | "success";
  errors?: Record<string, string[]>;
};

export const initialContactState: ContactState = { status: "idle" };
