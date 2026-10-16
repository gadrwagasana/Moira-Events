// Required/optional defaults for the wedding enquiry form. The owner's brief
// explicitly left "which fields are mandatory" unconfirmed (sitemap §11 /
// commerce-architecture prompt §6) — these are reasonable provisional
// defaults, easy to flip here once the owner confirms the real requirements.
export const weddingEnquiryFieldConfig = {
  fullName: { required: true },
  email: { required: true },
  phone: { required: true },
  whatsapp: { required: false },
  preferredContactMethod: { required: false },
  weddingTypeId: { required: true },
  weddingDate: { required: false },
  location: { required: false },
  ceremonyLocation: { required: false },
  receptionLocation: { required: false },
  estimatedGuests: { required: false },
  budgetAmount: { required: false },
  budgetCurrency: { required: false },
  message: { required: false },
} as const;

export type WeddingEnquiryFieldName = keyof typeof weddingEnquiryFieldConfig;
