export type ConsultationState = {
  status: "idle" | "error" | "success";
  errors?: Record<string, string[]>;
  referenceNumber?: string;
};

export const initialConsultationState: ConsultationState = { status: "idle" };
