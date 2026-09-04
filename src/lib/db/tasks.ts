import { v4 as uuidv4 } from "uuid";
import { getDb, getLastSyncedAt, setLastSyncedAt } from "@/lib/db/dexie";
import type {
  LocalTask,
  TaskSyncPushItem,
  TaskSyncRequest,
  TaskSyncResponse,
} from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

export function normalizeSteps(steps: string[]): string[] {
  return steps.map((s) => s.replace(/\r/g, "")).filter((s) => s.trim().length > 0);
}

export function stepsToText(steps: string[]): string {
  return steps.join("\n");
}

export function textToSteps(text: string): string[] {
  return normalizeSteps(text.split("\n"));
}

export async function listLocalTasks(userId: string): Promise<LocalTask[]> {
  const db = getDb(userId);
  const all = await db.tasks.where("userId").equals(userId).toArray();
  return all
    .filter((t) => t.syncStatus !== "pending_delete" && !t.isDeleted)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getLocalTask(
  userId: string,
  id: string,
): Promise<LocalTask | null> {
  const db = getDb(userId);
  const task = await db.tasks.get(id);
  if (!task || task.userId !== userId) return null;
  if (task.isDeleted || task.syncStatus === "pending_delete") return null;
  return task;
}

export async function createLocalTask(
  userId: string,
  input: {
    title: string;
    description?: string | null;
    steps?: string[];
  },
): Promise<LocalTask> {
  const db = getDb(userId);
  const stamp = nowIso();
  const record: LocalTask = {
    id: uuidv4(),
    userId,
    title: input.title.trim() || "Untitled task",
    description: input.description?.trim() || null,
    steps: normalizeSteps(input.steps ?? []),
    isDeleted: false,
    createdAt: stamp,
    updatedAt: stamp,
    syncStatus: "pending_insert",
  };
  await db.tasks.put(record);
  return record;
}

export async function updateLocalTask(
  userId: string,
  id: string,
  input: {
    title: string;
    description?: string | null;
    steps: string[];
  },
): Promise<LocalTask | null> {
  const db = getDb(userId);
  const existing = await db.tasks.get(id);
  if (!existing || existing.userId !== userId) return null;

  const next: LocalTask = {
    ...existing,
    title: input.title.trim() || "Untitled task",
    description: input.description?.trim() || null,
    steps: normalizeSteps(input.steps),
    updatedAt: nowIso(),
    syncStatus:
      existing.syncStatus === "pending_insert"
        ? "pending_insert"
        : "pending_update",
  };
  await db.tasks.put(next);
  return next;
}

export async function deleteLocalTask(userId: string, id: string) {
  const db = getDb(userId);
  const existing = await db.tasks.get(id);
  if (!existing || existing.userId !== userId) return;

  if (existing.syncStatus === "pending_insert") {
    await db.tasks.delete(id);
    return;
  }

  await db.tasks.put({
    ...existing,
    isDeleted: true,
    updatedAt: nowIso(),
    syncStatus: "pending_delete",
  });
}

let taskSyncInFlight: Promise<void> | null = null;

export async function runTaskSync(userId: string): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  if (taskSyncInFlight) return taskSyncInFlight;

  taskSyncInFlight = (async () => {
    const db = getDb(userId);
    const pending = await db.tasks
      .where("syncStatus")
      .anyOf(["pending_insert", "pending_update", "pending_delete"])
      .toArray();

    const changes: TaskSyncPushItem[] = pending
      .filter((t) => t.userId === userId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        steps: t.steps,
        isDeleted: t.isDeleted || t.syncStatus === "pending_delete",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        syncStatus: t.syncStatus as TaskSyncPushItem["syncStatus"],
      }));

    const lastSyncedAt = await getLastSyncedAt(userId, "tasks-meta");
    const body: TaskSyncRequest = { changes, lastSyncedAt };

    const res = await fetch("/api/tasks/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Task sync failed (${res.status})`);
    }

    const data = (await res.json()) as TaskSyncResponse;

    await db.transaction("rw", db.tasks, db.syncMeta, async () => {
      for (const id of data.accepted) {
        const local = await db.tasks.get(id);
        if (!local) continue;

        if (local.syncStatus === "pending_delete" || local.isDeleted) {
          await db.tasks.delete(id);
        } else {
          await db.tasks.put({ ...local, syncStatus: "synced" });
        }
      }

      for (const remote of data.serverChanges) {
        const local = await db.tasks.get(remote.id);

        if (remote.isDeleted) {
          if (!local || remote.updatedAt >= local.updatedAt) {
            await db.tasks.delete(remote.id);
          }
          continue;
        }

        if (!local) {
          await db.tasks.put({
            ...remote,
            userId,
            syncStatus: "synced",
          });
          continue;
        }

        if (remote.updatedAt > local.updatedAt) {
          await db.tasks.put({
            ...remote,
            userId,
            syncStatus: "synced",
          });
        } else if (
          remote.updatedAt < local.updatedAt &&
          local.syncStatus === "synced"
        ) {
          await db.tasks.put({ ...local, syncStatus: "pending_update" });
        }
      }

      await setLastSyncedAt(userId, data.serverTime, "tasks-meta");
    });
  })().finally(() => {
    taskSyncInFlight = null;
  });

  return taskSyncInFlight;
}
