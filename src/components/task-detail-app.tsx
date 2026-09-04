"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Copy, Loader2, Pencil, Trash2 } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center pb-20 md:pb-0">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 pb-20 text-center md:pb-0">
        <h1 className="text-xl font-semibold">Task not found</h1>
        <Button asChild variant="outline">
          <Link href="/tasks">Back to tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <AppHeader
        online={online}
        syncing={syncing}
        pendingCount={pendingCount}
        onSync={() => void sync()}
      />

      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-4 sm:py-8">
        <SyncBanner online={online} />

        <div className="mb-5 space-y-4 sm:mb-6">
          <div className="space-y-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
              <Link href="/tasks">
                <ArrowLeft /> Tasks
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words font-[family-name:var(--font-display)] text-2xl tracking-tight sm:text-3xl">
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

          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="min-w-0 px-2 sm:px-4"
              onClick={() => void handleCopyAll()}
            >
              <Copy />
              <span className="truncate">Copy all</span>
            </Button>
            <Button asChild className="min-w-0 px-2 sm:px-4">
              <Link href={`/tasks/${task.id}/edit`}>
                <Pencil />
                <span className="truncate">Edit</span>
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-w-0 px-2 text-red-600 sm:px-4"
              onClick={() => void handleDelete()}
            >
              <Trash2 />
              <span className="truncate">Delete</span>
            </Button>
          </div>
        </div>

        {task.steps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/60 px-4 py-12 text-center sm:px-6 sm:py-14">
            <p className="text-sm text-[var(--muted-foreground)]">
              No commands in this task yet.
            </p>
            <Button asChild className="mt-4 w-full sm:w-auto">
              <Link href={`/tasks/${task.id}/edit`}>Add commands</Link>
            </Button>
          </div>
        ) : (
          <ol className="space-y-3">
            {task.steps.map((step, index) => (
              <li
                key={`${index}-${step.slice(0, 24)}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5 shadow-sm sm:p-3"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex w-6 shrink-0 items-start justify-center pt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--muted-foreground)] sm:w-8 sm:pt-2.5">
                    {index + 1}
                  </div>
                  <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-[var(--code-bg)] px-2.5 py-2 font-[family-name:var(--font-mono)] text-[12px] leading-relaxed text-[var(--code-fg)] sm:px-3 sm:py-2.5 sm:text-[13px]">
                    <code className="break-all whitespace-pre-wrap sm:whitespace-pre sm:break-normal">
                      {step}
                    </code>
                  </pre>
                  <div className="flex shrink-0 items-start">
                    <CopyButton
                      text={step}
                      successMessage={`Step ${index + 1} copied`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
