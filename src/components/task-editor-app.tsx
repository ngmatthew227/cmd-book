"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Copy, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { TaskStepsEditor } from "@/components/task-steps-editor";
import { SyncBanner } from "@/components/sync-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCommandLibrary, useTasks } from "@/hooks/use-tasks";
import { stepsToText, textToSteps } from "@/lib/db/tasks";
import type { LocalTask } from "@/lib/types";

export function TaskEditorApp({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { syncing, online, sync, update, remove, getById, tasks } =
    useTasks(userId);
  const library = useCommandLibrary(userId);

  const [task, setTask] = useState<LocalTask | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    void getById(taskId).then((row) => {
      if (cancelled) return;
      setTask(row);
      if (row) {
        setTitle(row.title);
        setDescription(row.description ?? "");
        setStepsText(stepsToText(row.steps));
        setDirty(false);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, taskId, getById]);

  const pendingCount = useMemo(
    () => tasks.filter((t) => t.syncStatus !== "synced").length,
    [tasks],
  );

  async function handleSave() {
    if (!task) return;
    setSaving(true);
    try {
      await update(task.id, {
        title,
        description: description.trim() || null,
        steps: textToSteps(stepsText),
      });
      setDirty(false);
      toast.success("Task saved");
      router.push(`/tasks/${task.id}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyAll() {
    const body = textToSteps(stepsText).join("\n");
    if (!body) {
      toast.error("No commands to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(body);
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
    <div className="min-h-screen pb-[calc(9.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <AppHeader
        online={online}
        syncing={syncing}
        pendingCount={pendingCount}
        onSync={() => void sync()}
      />

      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-8">
        <SyncBanner online={online} />

        <div className="mb-5 space-y-4 sm:mb-6 sm:flex sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:space-y-0">
          <div className="min-w-0 space-y-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
              <Link href={`/tasks/${task.id}`}>
                <ArrowLeft /> Back to task
              </Link>
            </Button>
            <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight sm:text-3xl">
              Edit task
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Combine commands into a workflow. Edit every line in one editor.
            </p>
          </div>
          <div className="hidden flex-wrap gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCopyAll()}
            >
              <Copy /> Copy all
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-600"
              onClick={() => void handleDelete()}
            >
              <Trash2 /> Delete
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !dirty}
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {dirty ? "Save" : "Saved"}
            </Button>
          </div>
        </div>

        <div className="mb-5 grid gap-4 sm:mb-6">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              placeholder="Deploy staging"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDirty(true);
              }}
              placeholder="Optional notes for this workflow"
              rows={2}
            />
          </div>
        </div>

        <TaskStepsEditor
          value={stepsText}
          library={library}
          onChange={(next) => {
            setStepsText(next);
            setDirty(true);
          }}
        />
      </main>

      {/* Mobile sticky action bar — sits above bottom nav */}
      <div
        className="fixed inset-x-0 z-30 border-t border-[var(--border)] bg-[var(--background)]/95 p-3 backdrop-blur-md md:hidden"
        style={{
          bottom: "calc(3.5rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-0"
            onClick={() => void handleCopyAll()}
          >
            <Copy /> Copy
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-0 text-red-600"
            onClick={() => void handleDelete()}
          >
            <Trash2 /> Delete
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-w-0"
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {dirty ? "Save" : "Saved"}
          </Button>
        </div>
      </div>
    </div>
  );
}
