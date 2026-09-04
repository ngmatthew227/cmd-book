import Dexie, { type EntityTable } from "dexie";
import type { LocalCommand, SyncMeta } from "@/lib/types";

export type CmdBookDB = Dexie & {
  commands: EntityTable<LocalCommand, "id">;
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

  dbCache.set(userId, db);
  return db;
}

export async function clearUserDb(userId: string) {
  const db = getDb(userId);
  await db.delete();
  dbCache.delete(userId);
}

export async function getLastSyncedAt(userId: string): Promise<string | null> {
  const db = getDb(userId);
  const meta = await db.syncMeta.get("meta");
  return meta?.lastSyncedAt ?? null;
}

export async function setLastSyncedAt(userId: string, iso: string) {
  const db = getDb(userId);
  await db.syncMeta.put({ id: "meta", userId, lastSyncedAt: iso });
}
