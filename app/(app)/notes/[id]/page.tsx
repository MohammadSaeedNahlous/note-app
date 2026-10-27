import { requireUser } from "@/lib/require-user";

export default async function NoteEditorPage() {
  await requireUser();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Note editor page — coming soon</h1>
    </main>
  );
}
