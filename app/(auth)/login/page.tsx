import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { registered } = await searchParams;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      {registered === "1" && (
        <p
          role="status"
          className="mb-4 rounded-md border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
        >
          Registration complete. Log in to continue.
        </p>
      )}
      <LoginForm />
      <p className="mt-6 text-sm text-foreground/70">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
          Create one
        </Link>
      </p>
    </>
  );
}
