import { v4 as uuidv4 } from "uuid";
import { getDb, getLastSyncedAt, setLastSyncedAt } from "@/lib/db/dexie";
import type {
  FolderSyncPushItem,
  FolderSyncRequest,
  FolderSyncResponse,
  LocalFolder,
} from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

export async function listLocalFolders(userId: string): Promise<LocalFolder[]> {
  const db = getDb(userId);
  const all = await db.folders.where("userId").equals(userId).toArray();
  return all
    .filter((f) => f.syncStatus !== "pending_delete" && !f.isDeleted)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createLocalFolder(
  userId: string,
  name: string,
): Promise<LocalFolder> {
  const db = getDb(userId);
  const stamp = nowIso();
  const record: LocalFolder = {
    id: uuidv4(),
    userId,
    name: name.trim() || "Untitled folder",
    isDeleted: false,
    createdAt: stamp,
    updatedAt: stamp,
    syncStatus: "pending_insert",
  };
  await db.folders.put(record);
  return record;
}

export async function renameLocalFolder(
  userId: string,
  id: string,
  name: string,
) {
  const db = getDb(userId);
  const existing = await db.folders.get(id);
  if (!existing || existing.userId !== userId) return null;
  const next: LocalFolder = {
    ...existing,
    name: name.trim() || existing.name,
    updatedAt: nowIso(),
    syncStatus:
      existing.syncStatus === "pending_insert"
        ? "pending_insert"
        : "pending_update",
  };
  await db.folders.put(next);
  return next;
}

export async function deleteLocalFolder(userId: string, id: string) {
  const db = getDb(userId);
  const existing = await db.folders.get(id);
  if (!existing || existing.userId !== userId) return;

  const commands = await db.commands.where("folderId").equals(id).toArray();
  for (const cmd of commands) {
    if (cmd.userId !== userId) continue;
    await db.commands.put({
      ...cmd,
      folderId: null,
      updatedAt: nowIso(),
      syncStatus:
        cmd.syncStatus === "pending_insert" ? "pending_insert" : "pending_update",
    });
  }

  if (existing.syncStatus === "pending_insert") {
    await db.folders.delete(id);
    return;
  }

  await db.folders.put({
    ...existing,
    isDeleted: true,
    updatedAt: nowIso(),
    syncStatus: "pending_delete",
  });
}

export async function upsertLocalFolder(
  userId: string,
  record: Omit<LocalFolder, "userId" | "syncStatus"> & {
    syncStatus?: LocalFolder["syncStatus"];
  },
) {
  const db = getDb(userId);
  const existing = await db.folders.get(record.id);
  if (existing && existing.updatedAt > record.updatedAt) return existing;
  const next: LocalFolder = {
    ...record,
    userId,
    syncStatus:
      record.syncStatus ??
      (existing
        ? existing.syncStatus === "pending_insert"
          ? "pending_insert"
          : "pending_update"
        : "pending_insert"),
  };
  await db.folders.put(next);
  return next;
}

let folderSyncInFlight: Promise<void> | null = null;

export async function runFolderSync(userId: string): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  if (folderSyncInFlight) return folderSyncInFlight;

  folderSyncInFlight = (async () => {
    const db = getDb(userId);
    const pending = await db.folders
      .where("syncStatus")
      .anyOf(["pending_insert", "pending_update", "pending_delete"])
      .toArray();

    const changes: FolderSyncPushItem[] = pending
      .filter((f) => f.userId === userId)
      .map((f) => ({
        id: f.id,
        name: f.name,
        isDeleted: f.isDeleted || f.syncStatus === "pending_delete",
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        syncStatus: f.syncStatus as FolderSyncPushItem["syncStatus"],
      }));

    const lastSyncedAt = await getLastSyncedAt(userId, "folders-meta");
    const body: FolderSyncRequest = { changes, lastSyncedAt };

    const res = await fetch("/api/folders/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Folder sync failed (${res.status})`);
    }

    const data = (await res.json()) as FolderSyncResponse;

    await db.transaction("rw", db.folders, db.syncMeta, async () => {
      for (const id of data.accepted) {
        const local = await db.folders.get(id);
        if (!local) continue;
        if (local.syncStatus === "pending_delete" || local.isDeleted) {
          await db.folders.delete(id);
        } else {
          await db.folders.put({ ...local, syncStatus: "synced" });
        }
      }

      for (const remote of data.serverChanges) {
        const local = await db.folders.get(remote.id);
        if (remote.isDeleted) {
          if (!local || remote.updatedAt >= local.updatedAt) {
            await db.folders.delete(remote.id);
          }
          continue;
        }

        if (!local) {
          await db.folders.put({
            ...remote,
            userId,
            syncStatus: "synced",
          });
          continue;
        }

        if (remote.updatedAt > local.updatedAt) {
          await db.folders.put({
            ...remote,
            userId,
            syncStatus: "synced",
          });
        } else if (
          remote.updatedAt < local.updatedAt &&
          local.syncStatus === "synced"
        ) {
          await db.folders.put({ ...local, syncStatus: "pending_update" });
        }
      }

      await setLastSyncedAt(userId, data.serverTime, "folders-meta");
    });
  })().finally(() => {
    folderSyncInFlight = null;
  });

  return folderSyncInFlight;
}
