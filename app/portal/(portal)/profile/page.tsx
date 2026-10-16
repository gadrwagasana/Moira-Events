import type { Metadata } from "next";
import { requireAuthenticatedClientId } from "@/lib/client-portal/auth";
import { getClientProfile } from "@/lib/client-portal/data";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = { title: "Profile — Moira Events Client Portal" };
export const dynamic = "force-dynamic";

export default async function PortalProfilePage() {
  const clientId = await requireAuthenticatedClientId();
  const client = await getClientProfile(clientId);
  if (!client) return null;

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl text-espresso-700">Profile</h1>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Your Details</h2>
        <ProfileForm fullName={client.fullName} email={client.email} phone={client.phone} whatsapp={client.whatsapp} />
      </section>

      <section className="rounded-xl border border-espresso-100 bg-ivory-50 p-6">
        <h2 className="mb-4 font-serif text-lg text-espresso-700">Change Password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
