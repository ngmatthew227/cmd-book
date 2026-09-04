import { getDb } from "@/lib/db/dexie";
import { upsertLocalCommand } from "@/lib/db/sync";
import { upsertLocalFolder } from "@/lib/db/folders";
import { listLocalTasks } from "@/lib/db/tasks";
import { listLocalCommands } from "@/lib/db/sync";
import { listLocalFolders } from "@/lib/db/folders";
import type { ExportPayload } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function exportUserData(userId: string): Promise<ExportPayload> {
  const [folders, commands, tasks] = await Promise.all([
    listLocalFolders(userId),
    listLocalCommands(userId),
    listLocalTasks(userId),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })),
    commands: commands.map((c) => ({
      id: c.id,
      folderId: c.folderId,
      title: c.title,
      command: c.command,
      description: c.description,
      tags: c.tags,
      language: c.language || "shell",
      isPinned: Boolean(c.isPinned),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      steps: t.steps,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isExportPayload(value: unknown): value is ExportPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<ExportPayload>;
  return (
    v.version === 1 &&
    Array.isArray(v.folders) &&
    Array.isArray(v.commands) &&
    Array.isArray(v.tasks)
  );
}

export async function importUserData(
  userId: string,
  raw: unknown,
): Promise<{ folders: number; commands: number; tasks: number }> {
  if (!isExportPayload(raw)) {
    throw new Error("Invalid cmd-book export file");
  }

  const db = getDb(userId);
  let folders = 0;
  let commands = 0;
  let tasks = 0;

  for (const folder of raw.folders) {
    const id = folder.id || uuidv4();
    await upsertLocalFolder(userId, {
      id,
      name: folder.name || "Imported folder",
      isDeleted: false,
      createdAt: folder.createdAt || new Date().toISOString(),
      updatedAt: folder.updatedAt || new Date().toISOString(),
      syncStatus: "pending_insert",
    });
    folders += 1;
  }

  const folderIds = new Set(
    (await listLocalFolders(userId)).map((f) => f.id),
  );

  for (const cmd of raw.commands) {
    const id = cmd.id || uuidv4();
    const folderId =
      cmd.folderId && folderIds.has(cmd.folderId) ? cmd.folderId : null;
    await upsertLocalCommand(userId, {
      id,
      folderId,
      title: cmd.title || "Imported command",
      command: cmd.command || "",
      description: cmd.description ?? null,
      tags: Array.isArray(cmd.tags) ? cmd.tags : [],
      language: cmd.language || "shell",
      isPinned: Boolean(cmd.isPinned),
      isDeleted: false,
      createdAt: cmd.createdAt || new Date().toISOString(),
      updatedAt: cmd.updatedAt || new Date().toISOString(),
      syncStatus: "pending_insert",
    });
    commands += 1;
  }

  for (const task of raw.tasks) {
    const id = task.id || uuidv4();
    const existing = await db.tasks.get(id);
    const stamp = new Date().toISOString();
    const next = {
      id,
      userId,
      title: task.title || "Imported task",
      description: task.description ?? null,
      steps: Array.isArray(task.steps) ? task.steps : [],
      isDeleted: false,
      createdAt: task.createdAt || stamp,
      updatedAt: task.updatedAt || stamp,
      syncStatus: existing
        ? existing.syncStatus === "pending_insert"
          ? ("pending_insert" as const)
          : ("pending_update" as const)
        : ("pending_insert" as const),
    };
    if (existing && existing.updatedAt > next.updatedAt) continue;
    await db.tasks.put(next);
    tasks += 1;
  }

  return { folders, commands, tasks };
}
