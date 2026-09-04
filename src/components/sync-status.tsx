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
    <div className="flex items-center gap-2">
      <Badge variant={online ? "default" : "secondary"} className="gap-1.5">
        {online ? <Cloud className="size-3" /> : <CloudOff className="size-3" />}
        {online ? "Online" : "Offline"}
        {pendingCount > 0 ? ` · ${pendingCount} pending` : null}
      </Badge>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onSync}
        disabled={!online || syncing}
        aria-label="Sync now"
      >
        {syncing ? (
          <Loader2 className="animate-spin" />
        ) : (
          <RefreshCw />
        )}
      </Button>
    </div>
  );
}

export function SyncBanner({ online }: { online: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  if (online || dismissed) return null;
  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100">
      <span>You&apos;re offline. Changes save locally and sync when you reconnect.</span>
      <button
        type="button"
        className="ml-3 text-xs underline"
        onClick={() => setDismissed(true)}
      >
        Dismiss
      </button>
    </div>
  );
}
