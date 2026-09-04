"use client";

import { useState } from "react";
import { Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SyncStatus({
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
  return (
    <div className="flex items-center gap-0.5 sm:gap-2">
      <Badge
        variant={online ? "default" : "secondary"}
        className="gap-1 px-1.5 sm:gap-1.5 sm:px-2"
        title={online ? "Online" : "Offline"}
      >
        {online ? <Cloud className="size-3" /> : <CloudOff className="size-3" />}
        <span className="hidden sm:inline">
          {online ? "Online" : "Offline"}
        </span>
        {pendingCount > 0 ? (
          <span className="tabular-nums">
            <span className="sm:hidden">{pendingCount}</span>
            <span className="hidden sm:inline"> · {pendingCount} pending</span>
          </span>
        ) : null}
      </Badge>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 sm:size-9"
        onClick={onSync}
        disabled={!online || syncing}
        aria-label="Sync now"
      >
        {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      </Button>
    </div>
  );
}

export function SyncBanner({ online }: { online: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  if (online || dismissed) return null;
  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:px-4 dark:text-amber-100">
      <span>
        You&apos;re offline. Changes save locally and sync when you reconnect.
      </span>
      <button
        type="button"
        className="self-start text-xs underline sm:ml-3 sm:self-auto"
        onClick={() => setDismissed(true)}
      >
        Dismiss
      </button>
    </div>
  );
}
