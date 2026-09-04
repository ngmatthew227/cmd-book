"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "cmd-book:active-user";

/** Tracks the active user so IndexedDB stays scoped per account (`cmd-book-${userId}`). */
export function AccountIsolation() {
  const { data, status } = useSession();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !data?.user?.id) return;
    const userId = data.user.id;
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored && stored !== userId) {
      window.dispatchEvent(
        new CustomEvent("cmd-book:user-switched", {
          detail: { from: stored, to: userId },
        }),
      );
    }

    window.localStorage.setItem(STORAGE_KEY, userId);
    prev.current = userId;
  }, [data?.user?.id, status]);

  return null;
}
