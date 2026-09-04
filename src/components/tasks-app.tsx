"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ListChecks, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { SyncBanner } from "@/components/sync-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/use-tasks";

export function TasksApp() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { tasks, loading, syncing, online, sync, create, remove } = useTasks(userId);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const pendingCount = useMemo(
    () => tasks.filter((t) => t.syncStatus !== "synced").length,
    [tasks],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.steps.some((s) => s.toLowerCase().includes(q)),
    );
  }, [tasks, query]);

  async function handleCreate() {
    setCreating(true);
    try {
      const task = await create({ title: "Untitled task", steps: [] });
      if (task) {
        router.push(`/tasks/${task.id}/edit`);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader
        online={online}
        syncing={syncing}
        pendingCount={pendingCount}
        onSync={() => void sync()}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <SyncBanner online={online} />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
              Tasks
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Bundle commands into workflows — edit every step on one page.
            </p>
          </div>
          <Button onClick={() => void handleCreate()} disabled={creating}>
            <Plus /> New task
          </Button>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            className="pl-9"
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]/50"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/60 px-6 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
              <ListChecks className="size-6" />
            </div>
            <h2 className="text-lg font-semibold">
              {query ? "No matches" : "No tasks yet"}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
              {query
                ? "Try a different search."
                : "Create a task, paste or insert commands, and edit the whole script at once."}
            </p>
            {!query ? (
              <Button className="mt-6" onClick={() => void handleCreate()}>
                <Plus /> Create your first task
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((task) => (
              <Card
                key={task.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="hover:underline"
                        >
                          {task.title}
                        </Link>
                      </CardTitle>
                      {task.description ? (
                        <CardDescription className="mt-1 line-clamp-2">
                          {task.description}
                        </CardDescription>
                      ) : null}
                    </div>
                    <Badge variant="secondary">{task.steps.length} steps</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="max-h-28 overflow-hidden rounded-lg bg-[var(--code-bg)] p-3 font-[family-name:var(--font-mono)] text-[12px] leading-relaxed text-[var(--code-fg)]">
                    <code>
                      {task.steps.length
                        ? task.steps.slice(0, 4).join("\n") +
                          (task.steps.length > 4 ? "\n…" : "")
                        : "# empty"}
                    </code>
                  </pre>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/tasks/${task.id}`}>Open</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/tasks/${task.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!window.confirm("Delete this task?")) return;
                        await remove(task.id);
                        toast.success("Task deleted");
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
