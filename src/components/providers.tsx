"use client";

import { Toaster } from "sonner";

export function Providers() {
  return (
    <Toaster
      position="bottom-right"
      gap={8}
      toastOptions={{
        style: {
          background: "#121214",
          color: "#efece7",
          border: "1px solid #2c2c30",
          borderRadius: "14px",
          fontSize: "13.5px",
          boxShadow: "0 16px 40px -12px rgb(23 24 26 / 0.45)",
        },
      }}
    />
  );
}
