export type SyncStatus =
  | "synced"
  | "pending_insert"
  | "pending_update"
  | "pending_delete";

export const COMMAND_LANGUAGES = [
  "shell",
  "bash",
  "powershell",
  "javascript",
  "typescript",
  "python",
  "sql",
  "json",
  "yaml",
  "dockerfile",
  "plaintext",
] as const;

export type CommandLanguage = (typeof COMMAND_LANGUAGES)[number];

export interface LocalFolder {
  id: string;
  userId: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalCommand {
  id: string;
  userId: string;
  folderId: string | null;
  title: string;
  command: string;
  description: string | null;
  tags: string[];
  language: string;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  steps: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface SyncMeta {
  id: string; // "meta" | "tasks-meta" | "folders-meta"
  userId: string;
  lastSyncedAt: string | null;
}

export interface SyncPushItem {
  id: string;
  folderId: string | null;
  title: string;
  command: string;
  description: string | null;
  tags: string[];
  language: string;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: Exclude<SyncStatus, "synced">;
}

export interface SyncPullItem {
  id: string;
  folderId: string | null;
  title: string;
  command: string;
  description: string | null;
  tags: string[];
  language: string;
  isPinned: boolean;
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

export interface TaskSyncPushItem {
  id: string;
  title: string;
  description: string | null;
  steps: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: Exclude<SyncStatus, "synced">;
}

export interface TaskSyncPullItem {
  id: string;
  title: string;
  description: string | null;
  steps: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSyncRequest {
  changes: TaskSyncPushItem[];
  lastSyncedAt: string | null;
}

export interface TaskSyncResponse {
  accepted: string[];
  serverChanges: TaskSyncPullItem[];
  serverTime: string;
}

export interface FolderSyncPushItem {
  id: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: Exclude<SyncStatus, "synced">;
}

export interface FolderSyncPullItem {
  id: string;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FolderSyncRequest {
  changes: FolderSyncPushItem[];
  lastSyncedAt: string | null;
}

export interface FolderSyncResponse {
  accepted: string[];
  serverChanges: FolderSyncPullItem[];
  serverTime: string;
}

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  folders: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;
  commands: Array<{
    id: string;
    folderId: string | null;
    title: string;
    command: string;
    description: string | null;
    tags: string[];
    language: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    steps: string[];
    createdAt: string;
    updatedAt: string;
  }>;
}
