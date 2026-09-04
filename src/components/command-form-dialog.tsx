"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMMAND_LANGUAGES, type LocalCommand, type LocalFolder } from "@/lib/types";

type FormState = {
  title: string;
  command: string;
  description: string;
  tags: string;
  language: string;
  folderId: string;
  isPinned: boolean;
};

const empty: FormState = {
  title: "",
  command: "",
  description: "",
  tags: "",
  language: "shell",
  folderId: "",
  isPinned: false,
};

export function CommandFormDialog({
  open,
  onOpenChange,
  initial,
  folders,
  defaultFolderId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: LocalCommand | null;
  folders: LocalFolder[];
  defaultFolderId?: string | null;
  onSubmit: (values: {
    title: string;
    command: string;
    description: string | null;
    tags: string[];
    language: string;
    folderId: string | null;
    isPinned: boolean;
  }) => Promise<void> | void;
}) {
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title: initial.title,
        command: initial.command,
        description: initial.description ?? "",
        tags: initial.tags.join(", "),
        language: initial.language || "shell",
        folderId: initial.folderId ?? "",
        isPinned: Boolean(initial.isPinned),
      });
    } else {
      setForm({
        ...empty,
        folderId: defaultFolderId ?? "",
      });
    }
  }, [open, initial, defaultFolderId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.command.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: form.title,
        command: form.command,
        description: form.description.trim() || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        language: form.language || "shell",
        folderId: form.folderId || null,
        isPinned: form.isPinned,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit command" : "New command"}</DialogTitle>
          <DialogDescription>
            Saved locally first, then synced when you&apos;re online.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Kill process on port"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="command">Command</Label>
            <Textarea
              id="command"
              value={form.command}
              onChange={(e) =>
                setForm((f) => ({ ...f, command: e.target.value }))
              }
              placeholder="npx kill-port 3000"
              className="font-[family-name:var(--font-mono)]"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={form.language}
                onChange={(e) =>
                  setForm((f) => ({ ...f, language: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm"
              >
                {COMMAND_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <select
                id="folder"
                value={form.folderId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, folderId: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm"
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional notes"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="git, docker, comma-separated"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) =>
                setForm((f) => ({ ...f, isPinned: e.target.checked }))
              }
              className="size-4 accent-[var(--primary)]"
            />
            Pin to top
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
