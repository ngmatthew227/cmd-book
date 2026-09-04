import Link from "next/link";
import { redirect } from "next/navigation";
import { BookMarked, CloudOff, Copy, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/library");
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,118,110,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,118,110,0.04)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
            <BookMarked className="size-4" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
            cmd-book
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-20 pt-10 md:pt-16">
        <p className="mb-4 font-[family-name:var(--font-display)] text-sm font-medium uppercase tracking-[0.2em] text-[var(--primary)]">
          cmd-book
        </p>
        <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
          Your terminal snippets, always one click away.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-[var(--muted-foreground)]">
          Store frequently used commands locally, copy instantly, and sync across
          devices when you&apos;re back online.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/register">Start for free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">I have an account</Link>
          </Button>
        </div>

        <div className="mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {[
            {
              icon: Copy,
              title: "One-click copy",
              body: "Grab any command into your clipboard with instant feedback.",
            },
            {
              icon: CloudOff,
              title: "Works offline",
              body: "IndexedDB is the source of truth. Create and edit without a network.",
            },
            {
              icon: Zap,
              title: "Auto sync",
              body: "Pending changes push and pull with last-write-wins conflict resolution.",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <item.icon className="size-5 text-[var(--primary)]" />
              <h2 className="font-semibold">{item.title}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
