"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { BookMarked, LogOut, User } from "lucide-react";
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

export function AppHeader({
  online,
  syncing,
  pendingCount,
  onSync,
}: {
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  onSync: () => void;
}) {
  const { data } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/library" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
            <BookMarked className="size-4" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg">
            cmd-book
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <SyncStatus
            online={online}
            syncing={syncing}
            pendingCount={pendingCount}
            onSync={onSync}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="size-4" />
                <span className="hidden sm:inline max-w-[140px] truncate">
                  {data?.user?.email ?? "Account"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {data?.user?.name || data?.user?.email || "Signed in"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
