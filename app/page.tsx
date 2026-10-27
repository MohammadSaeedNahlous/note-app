import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/require-user";

export default async function HomePage() {
  if (await getUser()) redirect("/notes");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold">Notes</h1>
      <p className="max-w-md text-foreground/70">
        Write rich-text notes and share them with a link when you want to.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
