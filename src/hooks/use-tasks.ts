"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { listLocalCommands, runSync } from "@/lib/db/sync";
import {
  createLocalTask,
  deleteLocalTask,
  getLocalTask,
  listLocalTasks,
  updateLocalTask,
} from "@/lib/db/tasks";
import type { LocalCommand, LocalTask } from "@/lib/types";
import { useOnline } from "@/hooks/use-online";

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const online = useOnline();

  const refresh = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setTasks(await listLocalTasks(userId));
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

  const create = useCallback(
    async (input?: {
      title?: string;
      description?: string | null;
      steps?: string[];
    }) => {
      if (!userId) return null;
      const task = await createLocalTask(userId, {
        title: input?.title ?? "Untitled task",
        description: input?.description,
        steps: input?.steps,
      });
      await refresh();
      if (navigator.onLine) void sync();
      return task;
    },
    [userId, refresh, sync],
  );

  const update = useCallback(
    async (
      id: string,
      input: {
        title: string;
        description?: string | null;
        steps: string[];
      },
    ) => {
      if (!userId) return;
      await updateLocalTask(userId, id, input);
      await refresh();
      if (navigator.onLine) void sync();
    },
    [userId, refresh, sync],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;
      await deleteLocalTask(userId, id);
      await refresh();
      if (navigator.onLine) void sync();
    },
    [userId, refresh, sync],
  );

  const getById = useCallback(
    async (id: string) => {
      if (!userId) return null;
      return getLocalTask(userId, id);
    },
    [userId],
  );

  return {
    tasks,
    loading,
    syncing,
    online,
    refresh,
    sync,
    create,
    update,
    remove,
    getById,
  };
}

export function useCommandLibrary(userId: string | undefined) {
  const [commands, setCommands] = useState<LocalCommand[]>([]);

  useEffect(() => {
    if (!userId) {
      setCommands([]);
      return;
    }
    void listLocalCommands(userId).then(setCommands);
  }, [userId]);

  return commands;
}
