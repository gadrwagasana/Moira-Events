import type { Metadata } from "next";
import { DivisionPageTemplate } from "@/components/DivisionPageTemplate";
import { divisions } from "@/lib/content/divisions";

export const metadata: Metadata = {
  title: "Parties & Social Events",
  description:
    "Birthdays, galas, anniversaries and private celebrations — planned and executed professionally by Moira Events.",
  alternates: { canonical: "/parties-social-events" },
};

const division = divisions.find((d) => d.slug === "parties-social-events")!;

export default function PartiesSocialEventsPage() {
  return <DivisionPageTemplate division={division} />;
}
