"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NoteDialog } from "@/components/ui/note-dialog";
import type { AdminJobRow } from "@/lib/types";

export function AdminJobActions({ job }: { job: AdminJobRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancellable = job.status !== "cancelled" && job.status !== "completed";

  async function run(note: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", note }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setOpen(false);
      toast.success("Job force-cancelled.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!cancellable) return null;

  return (
    <>
      <Button size="sm" variant="danger" onClick={() => setOpen(true)}>
        Force-cancel
      </Button>
      <NoteDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={run}
        title="Force-cancel this job?"
        description="Pending bids are released. This overrides the client's own control of the job — record why."
        confirmLabel="Cancel job"
        tone="danger"
        loading={busy}
      />
    </>
  );
}
