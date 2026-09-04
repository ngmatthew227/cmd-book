"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CornerDownLeft,
  FileCode2,
  ListChecks,
  Search,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listLocalCommands } from "@/lib/db/sync";
import { listLocalTasks } from "@/lib/db/tasks";
import type { LocalCommand, LocalTask } from "@/lib/types";
import { cn } from "@/lib/utils";

type Hit =
  | { kind: "command"; item: LocalCommand }
  | { kind: "task"; item: LocalTask };

export function CommandPalette() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [commands, setCommands] = useState<LocalCommand[]>([]);
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || !userId) return;
    void Promise.all([listLocalCommands(userId), listLocalTasks(userId)]).then(
      ([c, t]) => {
        setCommands(c);
        setTasks(t);
      },
    );
    setQuery("");
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, userId]);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cmdHits: Hit[] = commands
      .filter((c) => {
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          c.command.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .slice(0, 8)
      .map((item) => ({ kind: "command" as const, item }));

    const taskHits: Hit[] = tasks
      .filter((t) => {
        if (!q) return true;
        return (
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.steps.some((s) => s.toLowerCase().includes(q))
        );
      })
      .slice(0, 6)
      .map((item) => ({ kind: "task" as const, item }));

    return [...cmdHits, ...taskHits];
  }, [commands, tasks, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  async function activate(hit: Hit) {
    if (hit.kind === "command") {
      try {
        await navigator.clipboard.writeText(hit.item.command);
        toast.success(`Copied “${hit.item.title}”`);
      } catch {
        toast.error("Unable to copy");
      }
      setOpen(false);
      return;
    }
    router.push(`/tasks/${hit.item.id}`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search commands and tasks</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
          <Search className="size-4 shrink-0 text-[var(--muted-foreground)]" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands & tasks…"
            className="h-12 border-0 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && hits[active]) {
                e.preventDefault();
                void activate(hits[active]);
              }
            }}
          />
          <kbd className="hidden rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)] sm:inline">
            Esc
          </kbd>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {hits.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No matches
            </p>
          ) : (
            <ul className="space-y-1">
              {hits.map((hit, index) => {
                const selected = index === active;
                return (
                  <li key={`${hit.kind}-${hit.item.id}`}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left",
                        selected ? "bg-[var(--muted)]" : "hover:bg-[var(--muted)]/70",
                      )}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => void activate(hit)}
                    >
                      <span className="mt-0.5 text-[var(--primary)]">
                        {hit.kind === "command" ? (
                          <Terminal className="size-4" />
                        ) : (
                          <ListChecks className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {hit.item.title}
                          </span>
                          {hit.kind === "command" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                              <FileCode2 className="size-3" />
                              {hit.item.language || "shell"}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate font-[family-name:var(--font-mono)] text-xs text-[var(--muted-foreground)]">
                          {hit.kind === "command"
                            ? hit.item.command
                            : `${hit.item.steps.length} steps`}
                        </span>
                      </span>
                      {selected ? (
                        <CornerDownLeft className="mt-1 size-3.5 shrink-0 text-[var(--muted-foreground)]" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-[var(--border)] px-3 py-2 text-[11px] text-[var(--muted-foreground)]">
          Enter to copy command / open task · ↑↓ to navigate · Esc to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
