export type SyncStatus =
  | "synced"
  | "pending_insert"
  | "pending_update"
  | "pending_delete";

export interface LocalCommand {
  id: string;
  userId: string;
  title: string;
  command: string;
  description: string | null;
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface SyncMeta {
  id: string; // always "meta"
  userId: string;
  lastSyncedAt: string | null;
}

export interface SyncPushItem {
  id: string;
  title: string;
  command: string;
  description: string | null;
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: Exclude<SyncStatus, "synced">;
}

export interface SyncPullItem {
  id: string;
  title: string;
  command: string;
  description: string | null;
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncRequest {
  changes: SyncPushItem[];
  lastSyncedAt: string | null;
}

export interface SyncResponse {
  accepted: string[];
  serverChanges: SyncPullItem[];
  serverTime: string;
}
