import { v4 as uuidv4 } from "uuid";
import { getDb, getLastSyncedAt, setLastSyncedAt } from "@/lib/db/dexie";
import type {
  LocalCommand,
  SyncPushItem,
  SyncRequest,
  SyncResponse,
} from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

export async function listLocalCommands(userId: string): Promise<LocalCommand[]> {
  const db = getDb(userId);
  const all = await db.commands
    .where("userId")
    .equals(userId)
    .toArray();

  return all
    .filter((c) => c.syncStatus !== "pending_delete" && !c.isDeleted)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createLocalCommand(
  userId: string,
  input: {
    title: string;
    command: string;
    description?: string | null;
    tags?: string[];
  },
): Promise<LocalCommand> {
  const db = getDb(userId);
  const stamp = nowIso();
  const record: LocalCommand = {
    id: uuidv4(),
    userId,
    title: input.title.trim(),
    command: input.command,
    description: input.description?.trim() || null,
    tags: input.tags ?? [],
    isDeleted: false,
    createdAt: stamp,
    updatedAt: stamp,
    syncStatus: "pending_insert",
  };
  await db.commands.put(record);
  return record;
}

export async function updateLocalCommand(
  userId: string,
  id: string,
  input: {
    title: string;
    command: string;
    description?: string | null;
    tags?: string[];
  },
): Promise<LocalCommand | null> {
  const db = getDb(userId);
  const existing = await db.commands.get(id);
  if (!existing || existing.userId !== userId) return null;

  const next: LocalCommand = {
    ...existing,
    title: input.title.trim(),
    command: input.command,
    description: input.description?.trim() || null,
    tags: input.tags ?? [],
    updatedAt: nowIso(),
    syncStatus:
      existing.syncStatus === "pending_insert"
        ? "pending_insert"
        : "pending_update",
  };
  await db.commands.put(next);
  return next;
}

export async function deleteLocalCommand(userId: string, id: string) {
  const db = getDb(userId);
  const existing = await db.commands.get(id);
  if (!existing || existing.userId !== userId) return;

  if (existing.syncStatus === "pending_insert") {
    await db.commands.delete(id);
    return;
  }

  await db.commands.put({
    ...existing,
    isDeleted: true,
    updatedAt: nowIso(),
    syncStatus: "pending_delete",
  });
}

let syncInFlight: Promise<void> | null = null;

export async function runSync(userId: string): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const db = getDb(userId);
    const pending = await db.commands
      .where("syncStatus")
      .anyOf(["pending_insert", "pending_update", "pending_delete"])
      .toArray();

    const changes: SyncPushItem[] = pending
      .filter((c) => c.userId === userId)
      .map((c) => ({
        id: c.id,
        title: c.title,
        command: c.command,
        description: c.description,
        tags: c.tags,
        isDeleted: c.isDeleted || c.syncStatus === "pending_delete",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        syncStatus: c.syncStatus as SyncPushItem["syncStatus"],
      }));

    const lastSyncedAt = await getLastSyncedAt(userId);
    const body: SyncRequest = { changes, lastSyncedAt };

    const res = await fetch("/api/commands/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Sync failed (${res.status})`);
    }

    const data = (await res.json()) as SyncResponse;

    await db.transaction("rw", db.commands, db.syncMeta, async () => {
      for (const id of data.accepted) {
        const local = await db.commands.get(id);
        if (!local) continue;

        if (local.syncStatus === "pending_delete" || local.isDeleted) {
          await db.commands.delete(id);
        } else {
          await db.commands.put({ ...local, syncStatus: "synced" });
        }
      }

      for (const remote of data.serverChanges) {
        const local = await db.commands.get(remote.id);

        if (remote.isDeleted) {
          if (!local || remote.updatedAt >= local.updatedAt) {
            await db.commands.delete(remote.id);
          }
          continue;
        }

        if (!local) {
          await db.commands.put({
            ...remote,
            userId,
            syncStatus: "synced",
          });
          continue;
        }

        // LWW: remote wins when newer
        if (remote.updatedAt > local.updatedAt) {
          await db.commands.put({
            ...remote,
            userId,
            syncStatus: "synced",
          });
        } else if (
          remote.updatedAt < local.updatedAt &&
          local.syncStatus === "synced"
        ) {
          await db.commands.put({ ...local, syncStatus: "pending_update" });
        }
      }

      await setLastSyncedAt(userId, data.serverTime);
    });
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}
