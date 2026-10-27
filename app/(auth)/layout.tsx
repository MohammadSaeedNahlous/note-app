import { redirect } from "next/navigation";
import { getUser } from "@/lib/require-user";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getUser()) redirect("/notes");

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-foreground/10 p-8 shadow-sm">
        {children}
      </div>
    </main>
  );
}
