"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NoteDialog } from "@/components/ui/note-dialog";
import type { AdminFeeRow } from "@/lib/types";

type PendingAction = "mark_paid" | "waive" | null;

export function AdminFeeActions({ fee }: { fee: AdminFeeRow }) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  async function run(note: string) {
    if (!pending) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/fees/${fee.bidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: pending, note }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      const action = pending;
      setPending(null);
      toast.success(action === "mark_paid" ? "Fee marked paid." : "Fee waived.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (fee.feeStatus !== "pending") return null;

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={() => setPending("waive")}>
          Waive
        </Button>
        <Button size="sm" onClick={() => setPending("mark_paid")}>
          Mark paid
        </Button>
      </div>
      <NoteDialog
        open={pending === "mark_paid"}
        onClose={() => setPending(null)}
        onConfirm={run}
        title="Mark this fee as paid?"
        description="Use this for fees settled outside PayFast (e.g. offline). Record how."
        confirmLabel="Mark paid"
        loading={busy}
      />
      <NoteDialog
        open={pending === "waive"}
        onClose={() => setPending(null)}
        onConfirm={run}
        title="Waive this fee?"
        description="The pro will no longer owe this platform fee. Record why."
        confirmLabel="Waive fee"
        tone="danger"
        loading={busy}
      />
    </>
  );
}
