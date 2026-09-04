import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline · cmd-book",
};

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]">
        <BookMarked className="size-6" />
      </span>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
        You&apos;re offline
      </h1>
      <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
        cmd-book will keep working from your local library once the app shell is
        cached. Reconnect anytime to sync.
      </p>
      <Link href="/library" className="text-sm text-[var(--primary)] underline-offset-4 hover:underline">
        Open library
      </Link>
    </main>
  );
}
