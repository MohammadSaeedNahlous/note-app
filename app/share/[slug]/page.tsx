import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SharedNotePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Shared note page — coming soon</h1>
    </main>
  );
}
