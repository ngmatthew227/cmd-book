import Dexie, { type EntityTable } from "dexie";
import type { LocalCommand, LocalFolder, LocalTask, SyncMeta } from "@/lib/types";

export type CmdBookDB = Dexie & {
  commands: EntityTable<LocalCommand, "id">;
  tasks: EntityTable<LocalTask, "id">;
  folders: EntityTable<LocalFolder, "id">;
  syncMeta: EntityTable<SyncMeta, "id">;
};

const dbCache = new Map<string, CmdBookDB>();

export function getDb(userId: string): CmdBookDB {
  const existing = dbCache.get(userId);
  if (existing) return existing;

  const db = new Dexie(`cmd-book-${userId}`) as CmdBookDB;
  db.version(1).stores({
    commands: "id, userId, updatedAt, syncStatus, title",
    syncMeta: "id, userId",
  });
  db.version(2).stores({
    commands: "id, userId, updatedAt, syncStatus, title",
    tasks: "id, userId, updatedAt, syncStatus, title",
    syncMeta: "id, userId",
  });
  db.version(3)
    .stores({
      commands:
        "id, userId, folderId, updatedAt, syncStatus, title, isPinned",
      tasks: "id, userId, updatedAt, syncStatus, title",
      folders: "id, userId, updatedAt, syncStatus, name",
      syncMeta: "id, userId",
    })
    .upgrade(async (tx) => {
      const rows = await tx.table("commands").toArray();
      for (const row of rows) {
        await tx.table("commands").put({
          ...row,
          folderId: row.folderId ?? null,
          language: row.language ?? "shell",
          isPinned: row.isPinned ?? false,
        });
      }
    });

  dbCache.set(userId, db);
  return db;
}

export async function clearUserDb(userId: string) {
  const db = getDb(userId);
  await db.delete();
  dbCache.delete(userId);
}

export type SyncMetaKey = "meta" | "tasks-meta" | "folders-meta";

export async function getLastSyncedAt(
  userId: string,
  key: SyncMetaKey = "meta",
): Promise<string | null> {
  const db = getDb(userId);
  const meta = await db.syncMeta.get(key);
  return meta?.lastSyncedAt ?? null;
}

export async function setLastSyncedAt(
  userId: string,
  iso: string,
  key: SyncMetaKey = "meta",
) {
  const db = getDb(userId);
  await db.syncMeta.put({ id: key, userId, lastSyncedAt: iso });
}
