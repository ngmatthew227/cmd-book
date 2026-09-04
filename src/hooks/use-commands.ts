"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createLocalCommand,
  deleteLocalCommand,
  listLocalCommands,
  runSync,
  updateLocalCommand,
} from "@/lib/db/sync";
import type { LocalCommand } from "@/lib/types";
import { useOnline } from "@/hooks/use-online";

export function useCommands(userId: string | undefined) {
  const [commands, setCommands] = useState<LocalCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const online = useOnline();

  const refresh = useCallback(async () => {
    if (!userId) {
      setCommands([]);
      setLoading(false);
      return;
    }
    const rows = await listLocalCommands(userId);
    setCommands(rows);
    setLoading(false);
  }, [userId]);

  const sync = useCallback(async () => {
    if (!userId || !navigator.onLine) return;
    setSyncing(true);
    try {
      await runSync(userId);
      await refresh();
    } catch (error) {
      console.error(error);
      toast.error("Sync failed — will retry when online");
    } finally {
      setSyncing(false);
    }
  }, [userId, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId || !online) return;
    void sync();
  }, [userId, online, sync]);

  useEffect(() => {
    if (!userId) return;
    const onFocus = () => {
      if (navigator.onLine) void sync();
    };
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(() => {
      if (navigator.onLine) void sync();
    }, 30_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [userId, sync]);

  const create = useCallback(
    async (input: {
      title: string;
      command: string;
      description?: string | null;
      tags?: string[];
    }) => {
      if (!userId) return;
      await createLocalCommand(userId, input);
      await refresh();
      if (navigator.onLine) void sync();
    },
    [userId, refresh, sync],
  );

  const update = useCallback(
    async (
      id: string,
      input: {
        title: string;
        command: string;
        description?: string | null;
        tags?: string[];
      },
    ) => {
      if (!userId) return;
      await updateLocalCommand(userId, id, input);
      await refresh();
      if (navigator.onLine) void sync();
    },
    [userId, refresh, sync],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;
      await deleteLocalCommand(userId, id);
      await refresh();
      if (navigator.onLine) void sync();
    },
    [userId, refresh, sync],
  );

  return {
    commands,
    loading,
    syncing,
    online,
    refresh,
    sync,
    create,
    update,
    remove,
  };
}
