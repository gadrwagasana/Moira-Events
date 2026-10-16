export type WeddingEnquiryState = {
  status: "idle" | "error" | "success";
  errors?: Record<string, string[]>;
  referenceNumber?: string;
  submittedAt?: string;
};

export const initialWeddingEnquiryState: WeddingEnquiryState = { status: "idle" };
