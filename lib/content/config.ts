// Business contact details confirmed in the Moira Events discovery brief.
export const siteConfig = {
  name: "Moira Events",
  tagline: "Weddings | Parties | Corporate Events",
  email: "moiraevents27@gmail.com",
  phone: "0787553323",
  // International E.164 form — used for tel: links so the number works
  // correctly when tapped from any country, not just Rwanda.
  phoneIntl: "+250787553323",
  phoneDisplay: "+250 787 553 323",
  // WhatsApp deep link uses the international format of the confirmed number.
  // Rwanda country code (+250) assumed from "current market: Rwanda" in the
  // brief; confirm with the owner before go-live if the line is different.
  whatsappNumber: "250787553323",
  country: "Rwanda",
  // No specific city has ever been confirmed for this business (only
  // "current market: Rwanda" from the original brief) — do not display a
  // city here until the owner confirms one; showing "Rwanda" alone is the
  // only location claim actually backed by that brief.
};
