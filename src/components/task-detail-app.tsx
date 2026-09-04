"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Copy,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { CopyButton } from "@/components/copy-button";
import { SyncBanner } from "@/components/sync-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { stepsToText } from "@/lib/db/tasks";
import type { LocalTask } from "@/lib/types";

export function TaskDetailApp({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { syncing, online, sync, remove, getById, tasks } = useTasks(userId);

  const [task, setTask] = useState<LocalTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    void getById(taskId).then((row) => {
      if (cancelled) return;
      setTask(row);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, taskId, getById, tasks]);

  const pendingCount = useMemo(
    () => tasks.filter((t) => t.syncStatus !== "synced").length,
    [tasks],
  );

  async function handleCopyAll() {
    if (!task?.steps.length) {
      toast.error("No commands to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(stepsToText(task.steps));
      toast.success("All steps copied");
    } catch {
      toast.error("Unable to copy");
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!window.confirm("Delete this task?")) return;
    await remove(task.id);
    toast.success("Task deleted");
    router.push("/tasks");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">Task not found</h1>
        <Button asChild variant="outline">
          <Link href="/tasks">Back to tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader
        online={online}
        syncing={syncing}
        pendingCount={pendingCount}
        onSync={() => void sync()}
      />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <SyncBanner online={online} />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
              <Link href="/tasks">
                <ArrowLeft /> Tasks
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
                {task.title}
              </h1>
              <Badge variant="secondary">{task.steps.length} steps</Badge>
              {task.syncStatus !== "synced" ? (
                <Badge variant="outline">
                  {task.syncStatus.replace("pending_", "")}
                </Badge>
              ) : null}
            </div>
            {task.description ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {task.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void handleCopyAll()}>
              <Copy /> Copy all
            </Button>
            <Button asChild>
              <Link href={`/tasks/${task.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-600"
              onClick={() => void handleDelete()}
            >
              <Trash2 /> Delete
            </Button>
          </div>
        </div>

        {task.steps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/60 px-6 py-14 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              No commands in this task yet.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/tasks/${task.id}/edit`}>Add commands</Link>
            </Button>
          </div>
        ) : (
          <ol className="space-y-3">
            {task.steps.map((step, index) => (
              <li
                key={`${index}-${step.slice(0, 24)}`}
                className="group flex items-stretch gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm"
              >
                <div className="flex w-8 shrink-0 items-start justify-center pt-2.5 font-[family-name:var(--font-mono)] text-xs text-[var(--muted-foreground)]">
                  {index + 1}
                </div>
                <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-[var(--code-bg)] px-3 py-2.5 font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-[var(--code-fg)]">
                  <code>{step}</code>
                </pre>
                <div className="flex shrink-0 items-start pt-0.5">
                  <CopyButton
                    text={step}
                    successMessage={`Step ${index + 1} copied`}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
