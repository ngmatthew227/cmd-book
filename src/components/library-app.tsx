"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Terminal } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { CommandCard } from "@/components/command-card";
import { CommandFormDialog } from "@/components/command-form-dialog";
import { SyncBanner } from "@/components/sync-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCommands } from "@/hooks/use-commands";
import type { LocalCommand } from "@/lib/types";

export function LibraryApp() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const {
    commands,
    loading,
    syncing,
    online,
    sync,
    create,
    update,
    remove,
  } = useCommands(userId);

  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocalCommand | null>(null);

  const pendingCount = useMemo(
    () => commands.filter((c) => c.syncStatus !== "synced").length,
    [commands],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.command.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [commands, query]);

  return (
    <div className="min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <AppHeader
        online={online}
        syncing={syncing}
        pendingCount={pendingCount}
        onSync={() => void sync()}
      />

      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-8">
        <SyncBanner online={online} />

        <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight sm:text-3xl">
              Your commands
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Local-first library — copy instantly, sync when online.
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

        <div className="relative mb-5 w-full sm:mb-6 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            className="pl-9"
            placeholder="Search title, command, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

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
              {query ? "No matches" : "No commands yet"}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
              {query
                ? "Try a different search."
                : "Add your frequently used terminal snippets and copy them with one click."}
            </p>
            {!query ? (
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
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {filtered.map((item) => (
              <CommandCard
                key={item.id}
                item={item}
                onEdit={(cmd) => {
                  setEditing(cmd);
                  setDialogOpen(true);
                }}
                onDelete={(id) => void remove(id)}
              />
            ))}
          </div>
        )}
      </main>

      <CommandFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
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
