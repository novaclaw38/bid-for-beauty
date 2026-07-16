"use client";

import { BadgeCheck, Gavel, PencilLine, PartyPopper, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { BidStatusPill } from "@/components/ui/pill";
import { cn, formatCurrency } from "@/lib/utils";

interface MyBid {
  id: string;
  amount: number;
  message: string;
  status: string;
}

export function ProBidSection({
  jobId,
  jobStatus,
  budgetMin,
  budgetMax,
  clientName,
  myBid: initialBid,
}: {
  jobId: string;
  jobStatus: string;
  budgetMin: number;
  budgetMax: number;
  clientName: string;
  myBid: MyBid | null;
}) {
  const router = useRouter();
  const [myBid, setMyBid] = useState<MyBid | null>(initialBid);
  const [amount, setAmount] = useState(
    String(initialBid?.amount ?? Math.round((budgetMin + budgetMax) / 2)),
  );
  const [message, setMessage] = useState(initialBid?.message ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const suggestions = [
    budgetMin,
    Math.round((budgetMin + budgetMax) / 2),
    budgetMax,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  async function placeBid(e: FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 1) {
      setError("Enter a valid amount.");
      return;
    }
    if (message.trim().length < 20) {
      setError("Tell the client why you're the right fit (20+ characters).");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, message }),
      });
      const data = (await res.json()) as { error?: string; bidId?: string };
      if (!res.ok) throw new Error(data.error);
      setMyBid({ id: data.bidId!, amount: amt, message: message.trim(), status: "pending" });
      toast.success("Bid placed. The client has been notified.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't place your bid.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!myBid) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 1) {
      setError("Enter a valid amount.");
      return;
    }
    if (message.trim().length < 20) {
      setError("Your pitch needs at least 20 characters.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/bids/${myBid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", amount: amt, message }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setMyBid({ ...myBid, amount: amt, message: message.trim() });
      setEditOpen(false);
      toast.success("Bid updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update your bid.");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!myBid) return;
    setWithdrawOpen(false);
    setBusy(true);
    const snapshot = myBid;
    setMyBid({ ...myBid, status: "withdrawn" });
    try {
      const res = await fetch(`/api/bids/${myBid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Bid withdrawn.");
      router.refresh();
    } catch (err) {
      setMyBid(snapshot);
      toast.error(err instanceof Error ? err.message : "Couldn't withdraw.");
    } finally {
      setBusy(false);
    }
  }

  /* ── Won state ─── */
  if (myBid?.status === "accepted") {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-night p-6 text-cream">
        <div className="dots-light absolute inset-0 opacity-60" />
        <div className="relative">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gold/20 text-gold">
            <PartyPopper className="size-5" />
          </span>
          <h3 className="mt-4 font-display text-xl font-semibold">
            You won this job
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-cream/60">
            {clientName} accepted your bid of{" "}
            <span className="font-semibold text-cream">
              {formatCurrency(myBid.amount)}
            </span>
            . Coordinate timing and details, then make them glow.
          </p>
        </div>
      </div>
    );
  }

  /* ── Closed without you ─── */
  if (jobStatus !== "open" && myBid?.status !== "pending") {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm font-semibold text-ink">
          {myBid?.status === "declined"
            ? "Not this time"
            : myBid?.status === "withdrawn"
              ? "You withdrew from this job"
              : "Bidding closed"}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
          {myBid?.status === "declined"
            ? "The client went with another pro. New jobs land daily, your next win is out there."
            : myBid?.status === "withdrawn"
              ? "This job moved on without your bid. Plenty more on the board."
              : "This job is no longer accepting bids."}
        </p>
      </div>
    );
  }

  /* ── Existing bid management ─── */
  if (myBid) {
    const pending = myBid.status === "pending";
    return (
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              Your bid
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              {formatCurrency(myBid.amount)}
            </p>
          </div>
          <BidStatusPill status={myBid.status} />
        </div>
        <p className="mt-3 rounded-xl bg-paper px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-2">
          “{myBid.message}”
        </p>
        {pending && (
          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => {
                setAmount(String(myBid.amount));
                setMessage(myBid.message);
                setEditOpen(true);
              }}
            >
              <PencilLine className="size-3.5" />
              Edit bid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              loading={busy}
              onClick={() => setWithdrawOpen(true)}
            >
              <Undo2 className="size-3.5" />
              Withdraw
            </Button>
          </div>
        )}

        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit your bid"
          description="Adjust your rate or sharpen your pitch. The client sees the latest version."
        >
          <form onSubmit={saveEdit} className="space-y-4">
            <Field label="Your rate (R)" htmlFor="edit-amount">
              <Input
                id="edit-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Your pitch" htmlFor="edit-message">
              <Textarea
                id="edit-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>
            {error && (
              <p className="rounded-xl bg-danger-soft px-4 py-3 text-[13px] font-medium text-danger">
                {error}
              </p>
            )}
            <Button type="submit" loading={busy} className="w-full">
              Save bid
            </Button>
          </form>
        </Dialog>

        <ConfirmDialog
          open={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          onConfirm={withdraw}
          title="Withdraw this bid?"
          description="The client won't see you as an option anymore. You can't re-bid on this job afterwards."
          confirmLabel="Withdraw bid"
          tone="danger"
        />
      </div>
    );
  }

  /* ── Bid form ─── */
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Gavel className="size-4.5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Place your bid</h3>
          <p className="text-[11.5px] text-ink-3">
            Client budget: {formatCurrency(budgetMin)}–{formatCurrency(budgetMax)}
          </p>
        </div>
      </div>

      <form onSubmit={placeBid} className="mt-5 space-y-4">
        <Field label="Your rate (R)" htmlFor="bid-amount">
          <Input
            id="bid-amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="150"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setAmount(String(s))}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset transition-all",
                  amount === String(s)
                    ? "bg-ink text-cream ring-ink"
                    : "bg-paper text-ink-2 ring-line-strong hover:ring-ink-3",
                )}
              >
                {formatCurrency(s)}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Your pitch"
          htmlFor="bid-message"
          hint={`${message.trim().length}/20+ characters`}
        >
          <Textarea
            id="bid-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Why you're the right pro: experience with this exact service, what's included, timing you can offer…"
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-danger-soft px-4 py-3 text-[13px] font-medium text-danger">
            {error}
          </p>
        )}

        <Button type="submit" loading={busy} className="w-full">
          <BadgeCheck className="size-4" />
          Send bid to {clientName.split(" ")[0]}
        </Button>
      </form>
    </div>
  );
}
