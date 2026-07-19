"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";

export function NoteDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "primary",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
}) {
  const [note, setNote] = useState("");
  const fieldId = useId();
  const trimmed = note.trim();

  function handleClose() {
    setNote("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} title={title} description={description}>
      <Field label="Reason" htmlFor={fieldId} hint="Required — shown in the admin activity log.">
        <Textarea
          id={fieldId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why are you taking this action?"
          disabled={loading}
        />
      </Field>
      <div className="mt-4 flex items-center justify-end gap-2.5">
        <Button variant="ghost" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          loading={loading}
          disabled={trimmed.length === 0}
          onClick={() => void onConfirm(trimmed)}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
