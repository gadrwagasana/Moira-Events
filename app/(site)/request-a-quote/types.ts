export type GeneralEnquiryState = {
  status: "idle" | "error" | "success";
  errors?: Record<string, string[]>;
  referenceNumber?: string;
  submittedAt?: string;
};

export const initialGeneralEnquiryState: GeneralEnquiryState = { status: "idle" };
