import { redirect } from "next/navigation";
import { getAuthenticatedClientId } from "@/lib/client-portal/auth";

export default async function PortalRootPage() {
  const clientId = await getAuthenticatedClientId();
  redirect(clientId ? "/portal/dashboard" : "/portal/login");
}
