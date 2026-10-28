import type { Metadata } from "next";
import { requireUser } from "@/lib/require-user";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireUser();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Notes dashboard — coming soon</h1>
    </main>
  );
}
