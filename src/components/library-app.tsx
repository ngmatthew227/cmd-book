"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FolderPlus,
  Folder as FolderIcon,
  Plus,
  Search,
  Terminal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { CommandCard } from "@/components/command-card";
import { CommandFormDialog } from "@/components/command-form-dialog";
import { SyncBanner } from "@/components/sync-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCommands } from "@/hooks/use-commands";
import type { LocalCommand } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LibraryApp() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const {
    commands,
    folders,
    loading,
    syncing,
    online,
    sync,
    create,
    update,
    togglePin,
    remove,
    createFolder,
    renameFolder,
    removeFolder,
    refresh,
  } = useCommands(userId);

  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState<string | "all" | "none">(
    "all",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocalCommand | null>(null);

  const pendingCount = useMemo(
    () =>
      commands.filter((c) => c.syncStatus !== "synced").length +
      folders.filter((f) => f.syncStatus !== "synced").length,
    [commands, folders],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of commands) for (const t of c.tags) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [commands]);

  const folderNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of folders) map.set(f.id, f.name);
    return map;
  }, [folders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return commands.filter((c) => {
      if (tagFilter && !c.tags.includes(tagFilter)) return false;
      if (folderFilter === "none" && c.folderId) return false;
      if (
        folderFilter !== "all" &&
        folderFilter !== "none" &&
        c.folderId !== folderFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.command.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        (c.language || "").toLowerCase().includes(q)
      );
    });
  }, [commands, query, tagFilter, folderFilter]);

  async function handleCreateFolder() {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    await createFolder(name.trim());
    toast.success("Folder created");
  }

  return (
    <div className="min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <AppHeader
        online={online}
        syncing={syncing}
        pendingCount={pendingCount}
        onSync={() => void sync()}
        onDataChange={() => void refresh()}
      />

      <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-5 sm:px-4 sm:py-8">
        <SyncBanner online={online} />

        <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight sm:text-3xl">
              Your commands
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Local-first library — press{" "}
              <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px]">
                ⌘K
              </kbd>{" "}
              to search.
            </p>
          </div>
          <Button
            className="w-full shrink-0 sm:w-auto"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus /> New command
          </Button>
        </div>

        <div className="mb-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Folders</h2>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => void handleCreateFolder()}
                aria-label="New folder"
              >
                <FolderPlus className="size-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {[
                { id: "all" as const, label: "All commands" },
                { id: "none" as const, label: "Unfiled" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFolderFilter(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm",
                    folderFilter === item.id
                      ? "bg-[var(--muted)] font-medium"
                      : "hover:bg-[var(--muted)]/70",
                  )}
                >
                  <FolderIcon className="size-3.5 text-[var(--muted-foreground)]" />
                  {item.label}
                </button>
              ))}
              {folders.map((folder) => (
                <div key={folder.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFolderFilter(folder.id)}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm",
                      folderFilter === folder.id
                        ? "bg-[var(--muted)] font-medium"
                        : "hover:bg-[var(--muted)]/70",
                    )}
                  >
                    <FolderIcon className="size-3.5 shrink-0 text-[var(--primary)]" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={async () => {
                      const name = window.prompt("Rename folder", folder.name);
                      if (!name?.trim()) return;
                      await renameFolder(folder.id, name.trim());
                    }}
                    aria-label="Rename folder"
                  >
                    <span className="text-xs">✎</span>
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 text-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Delete folder “${folder.name}”? Commands stay, unfiled.`,
                        )
                      ) {
                        return;
                      }
                      await removeFolder(folder.id);
                      if (folderFilter === folder.id) setFolderFilter("all");
                    }}
                    aria-label="Delete folder"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="relative mb-4 w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                className="pl-9"
                placeholder="Search title, command, tags…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {allTags.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Tags:
                </span>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setTagFilter((current) => (current === tag ? null : tag))
                    }
                  >
                    <Badge
                      variant={tagFilter === tag ? "default" : "secondary"}
                      className="cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  </button>
                ))}
                {tagFilter ? (
                  <button
                    type="button"
                    className="text-xs text-[var(--primary)] underline"
                    onClick={() => setTagFilter(null)}
                  >
                    Clear tag
                  </button>
                ) : null}
              </div>
            ) : null}

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]/50"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/60 px-4 py-12 text-center sm:px-6 sm:py-16">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Terminal className="size-6" />
                </div>
                <h2 className="text-lg font-semibold">
                  {query || tagFilter || folderFilter !== "all"
                    ? "No matches"
                    : "No commands yet"}
                </h2>
                <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
                  {query || tagFilter || folderFilter !== "all"
                    ? "Try a different filter."
                    : "Add your frequently used terminal snippets and copy them with one click."}
                </p>
                {!query && !tagFilter && folderFilter === "all" ? (
                  <Button
                    className="mt-6 w-full sm:w-auto"
                    onClick={() => {
                      setEditing(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus /> Add your first command
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="grid w-full gap-3 sm:grid-cols-2 sm:gap-4">
                {filtered.map((item) => (
                  <CommandCard
                    key={item.id}
                    item={item}
                    folderName={
                      item.folderId
                        ? folderNameById.get(item.folderId)
                        : null
                    }
                    onEdit={(cmd) => {
                      setEditing(cmd);
                      setDialogOpen(true);
                    }}
                    onDelete={(id) => void remove(id)}
                    onTogglePin={(id) => void togglePin(id)}
                    onTagClick={(tag) => setTagFilter(tag)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <CommandFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        folders={folders}
        defaultFolderId={
          folderFilter !== "all" && folderFilter !== "none"
            ? folderFilter
            : null
        }
        onSubmit={async (values) => {
          if (editing) {
            await update(editing.id, values);
          } else {
            await create(values);
          }
        }}
      />
    </div>
  );
}
