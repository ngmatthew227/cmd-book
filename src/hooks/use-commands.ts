"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createLocalCommand,
  deleteLocalCommand,
  listLocalCommands,
  runSync,
  togglePinLocalCommand,
  updateLocalCommand,
} from "@/lib/db/sync";
import {
  createLocalFolder,
  deleteLocalFolder,
  listLocalFolders,
  renameLocalFolder,
} from "@/lib/db/folders";
import type { LocalCommand, LocalFolder } from "@/lib/types";
import { useOnline } from "@/hooks/use-online";

export function useCommands(userId: string | undefined) {
  const [commands, setCommands] = useState<LocalCommand[]>([]);
  const [folders, setFolders] = useState<LocalFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const online = useOnline();

  const refresh = useCallback(async () => {
    if (!userId) {
      setCommands([]);
      setFolders([]);
      setLoading(false);
      return;
    }
    const [cmds, folds] = await Promise.all([
      listLocalCommands(userId),
      listLocalFolders(userId),
    ]);
    setCommands(cmds);
    setFolders(folds);
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
      language?: string;
      folderId?: string | null;
      isPinned?: boolean;
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
        language?: string;
        folderId?: string | null;
        isPinned?: boolean;
      },
    ) => {
      if (!userId) return;
      await updateLocalCommand(userId, id, input);
      await refresh();
      if (navigator.onLine) void sync();
    },
    [userId, refresh, sync],
  );

  const togglePin = useCallback(
    async (id: string) => {
      if (!userId) return;
      await togglePinLocalCommand(userId, id);
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

  const createFolder = useCallback(
    async (name: string) => {
      if (!userId) return;
      await createLocalFolder(userId, name);
      await refresh();
      if (navigator.onLine) void sync();
    },
    [userId, refresh, sync],
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      if (!userId) return;
      await renameLocalFolder(userId, id, name);
      await refresh();
      if (navigator.onLine) void sync();
    },
    [userId, refresh, sync],
  );

  const removeFolder = useCallback(
    async (id: string) => {
      if (!userId) return;
      await deleteLocalFolder(userId, id);
      await refresh();
      if (navigator.onLine) void sync();
    },
    [userId, refresh, sync],
  );

  return {
    commands,
    folders,
    loading,
    syncing,
    online,
    refresh,
    sync,
    create,
    update,
    togglePin,
    remove,
    createFolder,
    renameFolder,
    removeFolder,
  };
}
