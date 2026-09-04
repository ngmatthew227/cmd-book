"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { AccountIsolation } from "@/components/account-isolation";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AccountIsolation />
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
