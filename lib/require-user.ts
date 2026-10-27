import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** The verified session user, or null. Never trust a client-supplied userId. */
export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** For protected pages: redirects to /login when unauthenticated. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
