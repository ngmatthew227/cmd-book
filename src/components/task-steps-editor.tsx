"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { LocalCommand } from "@/lib/types";
import { textToSteps } from "@/lib/db/tasks";
import { cn } from "@/lib/utils";

export function TaskStepsEditor({
  value,
  onChange,
  library,
}: {
  value: string;
  onChange: (value: string) => void;
  library: LocalCommand[];
}) {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const lineCount = Math.max(value.split("\n").length, 1);
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1),
    [lineCount],
  );

  const stepCount = textToSteps(value).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library.slice(0, 40);
    return library
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.command.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 40);
  }, [library, query]);

  function insertCommand(command: string) {
    const el = textareaRef.current;
    if (!el) {
      const next = value.trimEnd()
        ? `${value.replace(/\s+$/, "")}\n${command}`
        : command;
      onChange(next);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const needsNewlineBefore = before.length > 0 && !before.endsWith("\n");
    const needsNewlineAfter = after.length > 0 && !after.startsWith("\n");
    const chunk =
      (needsNewlineBefore ? "\n" : "") +
      command +
      (needsNewlineAfter ? "\n" : "");
    const next = before + chunk + after;
    onChange(next);

    requestAnimationFrame(() => {
      const pos = before.length + chunk.length - (needsNewlineAfter ? 1 : 0);
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function addBlankLine() {
    const el = textareaRef.current;
    if (!el) {
      onChange(value.endsWith("\n") || value.length === 0 ? `${value}\n` : `${value}\n\n`);
      return;
    }
    const start = el.selectionStart;
    const before = value.slice(0, start);
    const after = value.slice(el.selectionEnd);
    const next = `${before}\n${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  }

  useEffect(() => {
    // keep line gutter scroll aligned after external value changes
    if (textareaRef.current && lineRef.current) {
      lineRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [value]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium">Commands</label>
          <span className="text-xs text-[var(--muted-foreground)]">
            One command per line — edit them all together
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--code-bg)] shadow-sm">
          <div className="flex max-h-[min(60vh,520px)] min-h-[280px]">
            <div
              ref={lineRef}
              aria-hidden
              className="select-none overflow-hidden border-r border-white/10 bg-black/20 px-3 py-4 text-right font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-white/35"
            >
              {lineNumbers.map((n) => (
                <div key={n}>{n}</div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={() => {
                if (textareaRef.current && lineRef.current) {
                  lineRef.current.scrollTop = textareaRef.current.scrollTop;
                }
              }}
              spellCheck={false}
              placeholder={"git status\nnpm install\nnpm run build"}
              className={cn(
                "min-h-[280px] w-full flex-1 resize-y bg-transparent px-3 py-4 font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-[var(--code-fg)] outline-none placeholder:text-white/30",
              )}
            />
          </div>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          {stepCount} step{stepCount === 1 ? "" : "s"}
          {" · "}
          Blank lines are ignored when saving
        </p>
      </div>

      <aside className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div>
          <h3 className="text-sm font-semibold">Insert from library</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            Click to insert at the cursor
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            className="h-9 pl-8 text-sm"
            placeholder="Search commands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[360px] space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-[var(--muted-foreground)]">
              No commands in library
            </p>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                type="button"
                onClick={() => insertCommand(cmd.command)}
                className="flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--muted)]"
              >
                <span className="truncate text-sm font-medium">{cmd.title}</span>
                <span className="truncate font-[family-name:var(--font-mono)] text-[11px] text-[var(--muted-foreground)]">
                  {cmd.command}
                </span>
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={addBlankLine}
          className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)]"
        >
          Add blank line
        </button>
      </aside>
    </div>
  );
}
