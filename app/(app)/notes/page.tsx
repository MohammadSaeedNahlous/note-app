import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";

// The notes list lives on /dashboard.
export default async function NotesPage() {
  await requireUser();
  redirect("/dashboard");
}
