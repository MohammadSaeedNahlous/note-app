import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
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
