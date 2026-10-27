import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/require-user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-foreground/10 px-6 py-3">
        <Link href="/notes" className="font-semibold">
          Notes
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-foreground/70">{user.name}</span>
          <LogoutButton />
        </div>
      </header>
      {children}
    </>
  );
}
