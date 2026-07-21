"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { AdminUserRow } from "@/lib/types";

export function AdminUserActions({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isSuspended = user.status === "suspended";
  const action = isSuspended ? "reinstate" : "suspend";

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setOpen(false);
      toast.success(isSuspended ? "User reinstated." : "User suspended.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant={isSuspended ? "secondary" : "danger"}
        onClick={() => setOpen(true)}
      >
        {isSuspended ? "Reinstate" : "Suspend"}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={run}
        title={isSuspended ? "Reinstate this user?" : "Suspend this user?"}
        description={
          isSuspended
            ? "They'll regain access on their next request."
            : "They'll be signed out on their next request. Their jobs and bids are left as-is."
        }
        confirmLabel={isSuspended ? "Reinstate" : "Suspend"}
        tone={isSuspended ? "primary" : "danger"}
        loading={busy}
      />
    </>
  );
}
