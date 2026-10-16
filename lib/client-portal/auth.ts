import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CLIENT_SESSION_COOKIE, verifyClientSessionToken } from "./session";

export async function getAuthenticatedClientId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(CLIENT_SESSION_COOKIE)?.value;
  return verifyClientSessionToken(token);
}

// Called at the top of every protected portal Server Component / Server
// Action — the real authorization boundary is here and in the data-layer
// ownership filters, never the proxy.ts route matcher alone.
export async function requireAuthenticatedClientId(): Promise<string> {
  const clientId = await getAuthenticatedClientId();
  if (!clientId) {
    redirect("/portal/login");
  }
  return clientId;
}
