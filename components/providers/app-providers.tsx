"use client";

import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          className: "surface-card border border-slate-200 text-slate-900",
        }}
      />
    </>
  );
}
