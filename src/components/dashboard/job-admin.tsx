"use client";

import { CheckCircle2, PencilLine, RotateCcw, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { JobForm, valuesFromJob } from "@/components/dashboard/job-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import type { JobCardData } from "@/lib/types";

type PendingAction = "complete" | "cancel" | "reopen" | "delete" | null;

export function JobAdmin({ job }: { job: JobCardData }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  async function runAction(action: PendingAction) {
    if (!action) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        ...(action !== "delete" ? { body: JSON.stringify({ action }) } : {}),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setPendingAction(null);
      if (action === "delete") {
        toast.success("Job deleted.");
        router.replace("/dashboard/jobs");
      } else {
        toast.success(
          action === "complete"
            ? "Marked as completed. Nicely done."
            : action === "cancel"
              ? "Job cancelled and pending bids released."
              : "Job reopened for bids.",
        );
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        Manage this job
      </p>
      <div className="mt-3.5 flex flex-col gap-2">
        {job.status === "open" && (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <PencilLine className="size-4" />
            Edit details
          </Button>
        )}
        {job.status === "awarded" && (
          <Button onClick={() => setPendingAction("complete")}>
            <CheckCircle2 className="size-4" />
            Mark as completed
          </Button>
        )}
        {job.status === "cancelled" && (
          <Button variant="secondary" onClick={() => setPendingAction("reopen")}>
            <RotateCcw className="size-4" />
            Reopen for bids
          </Button>
        )}
        {(job.status === "open" || job.status === "awarded") && (
          <Button variant="ghost" onClick={() => setPendingAction("cancel")}>
            <XCircle className="size-4" />
            Cancel job
          </Button>
        )}
        {job.status !== "completed" && job.status !== "awarded" && (
          <Button variant="danger" onClick={() => setPendingAction("delete")}>
            <Trash2 className="size-4" />
            Delete job
          </Button>
        )}
      </div>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit job"
        description="Changes apply immediately. Pros with pending bids will see the updated brief."
        wide
      >
        <JobForm
          mode="edit"
          jobId={job.id}
          initialValues={valuesFromJob(job)}
          onSaved={() => setEditOpen(false)}
          onCancel={() => setEditOpen(false)}
        />
      </Dialog>

      <ConfirmDialog
        open={pendingAction === "complete"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => runAction("complete")}
        title="Mark this job as completed?"
        description="Confirm the service was delivered. This wraps up the booking."
        confirmLabel="Mark completed"
        loading={busy}
      />
      <ConfirmDialog
        open={pendingAction === "cancel"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => runAction("cancel")}
        title="Cancel this job?"
        description="Pending bids will be released and pros will stop seeing this job as available. You can reopen it later."
        confirmLabel="Cancel job"
        tone="danger"
        loading={busy}
      />
      <ConfirmDialog
        open={pendingAction === "reopen"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => runAction("reopen")}
        title="Reopen this job for bids?"
        description="The job goes back on the board and pros can bid again."
        confirmLabel="Reopen job"
        loading={busy}
      />
      <ConfirmDialog
        open={pendingAction === "delete"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => runAction("delete")}
        title="Delete this job permanently?"
        description="The job and all its bids are removed for good. This cannot be undone."
        confirmLabel="Delete permanently"
        tone="danger"
        loading={busy}
      />
    </div>
  );
}
