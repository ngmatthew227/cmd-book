"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BookMarked,
  Download,
  ListChecks,
  LogOut,
  Terminal,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SyncStatus } from "@/components/sync-status";
import {
  downloadJson,
  exportUserData,
  importUserData,
} from "@/lib/db/backup";
import { cn } from "@/lib/utils";

const links = [
  { href: "/library", label: "Commands", icon: Terminal },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
];

export function AppHeader({
  online,
  syncing,
  pendingCount,
  onSync,
  onDataChange,
}: {
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  onSync: () => void;
  onDataChange?: () => void;
}) {
  const { data } = useSession();
  const pathname = usePathname();
  const importRef = useRef<HTMLInputElement>(null);
  const userId = data?.user?.id;

  async function handleExport() {
    if (!userId) return;
    try {
      const payload = await exportUserData(userId);
      downloadJson(
        `cmd-book-export-${new Date().toISOString().slice(0, 10)}.json`,
        payload,
      );
      toast.success("Export downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Export failed");
    }
  }

  async function handleImportFile(file: File) {
    if (!userId) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const result = await importUserData(userId, json);
      toast.success(
        `Imported ${result.commands} commands, ${result.tasks} tasks, ${result.folders} folders`,
      );
      onDataChange?.();
      onSync();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Import failed",
      );
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link
              href="/library"
              className="flex min-w-0 items-center gap-2 font-semibold tracking-tight"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
                <BookMarked className="size-4" />
              </span>
              <span className="truncate font-[family-name:var(--font-display)] text-lg">
                cmd-book
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-[var(--muted)] font-medium text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <SyncStatus
              online={online}
              syncing={syncing}
              pendingCount={pendingCount}
              onSync={onSync}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="sm:h-8 sm:w-auto sm:gap-2 sm:px-3"
                  aria-label="Account menu"
                >
                  <User className="size-4" />
                  <span className="hidden max-w-[140px] truncate sm:inline">
                    {data?.user?.email ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {data?.user?.name || data?.user?.email || "Signed in"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleExport()}>
                  <Download /> Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => importRef.current?.click()}>
                  <Upload /> Import JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleImportFile(file);
              }}
            />
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <div className="mx-auto grid h-14 max-w-lg grid-cols-2">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)]",
                )}
              >
                <Icon className="size-5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
