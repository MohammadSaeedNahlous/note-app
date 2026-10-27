import { requireUser } from "@/lib/require-user";

export default async function NotesPage() {
  await requireUser();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Notes dashboard — coming soon</h1>
    </main>
  );
}
