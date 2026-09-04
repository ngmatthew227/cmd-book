"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { AccountIsolation } from "@/components/account-isolation";
import { CommandPalette } from "@/components/command-palette";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AccountIsolation />
      <CommandPalette />
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "font-[family-name:var(--font-sans)]",
        }}
      />
    </SessionProvider>
  );
}
