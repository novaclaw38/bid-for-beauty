"use client";

import { Toaster } from "sonner";

export function Providers() {
  return (
    <Toaster
      position="bottom-right"
      gap={8}
      toastOptions={{
        style: {
          background: "var(--color-night)",
          color: "var(--color-cream)",
          border: "1px solid var(--color-night-line)",
          borderRadius: "14px",
          fontSize: "13.5px",
          boxShadow: "0 16px 40px -12px rgb(36 24 38 / 0.45)",
        },
      }}
    />
  );
}
