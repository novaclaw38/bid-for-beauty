"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Award, Hourglass, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { BidStatusPill } from "@/components/ui/pill";
import { categoryLabel } from "@/lib/constants";
import type { BidWithPro } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function BidBoard({
  bids: initialBids,
  jobStatus,
  currencyNote,
}: {
  bids: BidWithPro[];
  jobStatus: string;
  currencyNote: string;
}) {
  const router = useRouter();
  const [bids, setBids] = useState(initialBids);
  const [pendingAccept, setPendingAccept] = useState<BidWithPro | null>(null);
  const [pendingDecline, setPendingDecline] = useState<BidWithPro | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const rank = (s: string) =>
      s === "accepted" ? 0 : s === "pending" ? 1 : s === "declined" ? 2 : 3;
    return [...bids].sort(
      (a, b) => rank(a.status) - rank(b.status) || a.amount - b.amount,
    );
  }, [bids]);

  const accepting = jobStatus === "open";
  const winningBid = bids.find((b) => b.status === "accepted");
  const others = winningBid ? sorted.filter((b) => b.id !== winningBid.id) : sorted;

  const pendingByPrice = [...bids]
    .filter((b) => b.status === "pending")
    .sort((a, b) => a.amount - b.amount);
  const pendingRank = new Map(pendingByPrice.map((b, i) => [b.id, i + 1]));
  const leadingAmount = pendingByPrice[0]?.amount;

  async function acceptBid() {
    if (!pendingAccept) return;
    const target = pendingAccept;
    setPendingAccept(null);
    setBusyId(target.id);
    // Optimistic: accept target, decline remaining pendings
    const snapshot = bids;
    setBids((prev) =>
      prev.map((b) =>
        b.id === target.id
          ? { ...b, status: "accepted" as const }
          : b.status === "pending"
            ? { ...b, status: "declined" as const }
            : b,
      ),
    );
    try {
      const res = await fetch(`/api/bids/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(`${target.pro.name} got the job. Nice choice.`);
      router.refresh();
    } catch (err) {
      setBids(snapshot);
      toast.error(err instanceof Error ? err.message : "Couldn't accept that bid.");
    } finally {
      setBusyId(null);
    }
  }

  async function declineBid(bid: BidWithPro) {
    setPendingDecline(null);
    setBusyId(bid.id);
    const snapshot = bids;
    setBids((prev) =>
      prev.map((b) => (b.id === bid.id ? { ...b, status: "declined" as const } : b)),
    );
    try {
      const res = await fetch(`/api/bids/${bid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Bid declined.");
      router.refresh();
    } catch (err) {
      setBids(snapshot);
      toast.error(err instanceof Error ? err.message : "Couldn't decline that bid.");
    } finally {
      setBusyId(null);
    }
  }

  if (bids.length === 0) {
    return (
      <EmptyState
        icon={Hourglass}
        title="No bids yet"
        description="Pros near you can see this job. Most jobs get their first bid within the hour, hang tight."
      />
    );
  }

  return (
    <div className="space-y-3">
      {winningBid ? (
        <WinningBidCard bid={winningBid} />
      ) : (
        <p className="text-xs text-ink-3">
          {pendingByPrice.length} pending · ranked by price, lowest leads ·{" "}
          {currencyNote}
        </p>
      )}

      <div className="relative space-y-3 pl-9">
        {others.length > 1 ? (
          <div
            aria-hidden
            className="absolute bottom-2 left-[13px] top-2 w-px bg-line"
          />
        ) : null}
        <AnimatePresence initial={false}>
          {others.map((bid) => {
            const rank = pendingRank.get(bid.id);
            const delta =
              rank && rank > 1 && leadingAmount != null
                ? bid.amount - leadingAmount
                : null;
            return (
              <motion.div
                key={bid.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                className="relative"
              >
                {rank ? (
                  <span
                    className={cn(
                      "absolute -left-9 top-5 flex size-6 items-center justify-center rounded-full font-display text-[11px] font-semibold ring-1",
                      rank === 1
                        ? "bg-success text-success-soft ring-success/30"
                        : "bg-surface text-ink-2 ring-line",
                    )}
                  >
                    {rank}
                  </span>
                ) : null}
                <div
                  className={cn(
                    "rounded-2xl border bg-surface p-5 transition-colors",
                    bid.status === "pending"
                      ? "border-line hover:border-line-strong"
                      : "border-line/70 opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={bid.pro.name} hue={bid.pro.avatarHue} size="lg" />
                      <div>
                        <p className="text-sm font-semibold text-ink">{bid.pro.name}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-ink-3">
                          <span className="inline-flex items-center gap-1">
                            <Star className="size-3 fill-gold text-gold" />
                            {bid.pro.rating ?? "New"}
                          </span>
                          <span>{bid.pro.jobsCompleted} jobs done</span>
                          {bid.pro.specialties.length > 0 && (
                            <span className="hidden sm:inline">
                              {bid.pro.specialties.map(categoryLabel).join(" · ")}
                            </span>
                          )}
                        </div>
                        {bid.pro.photos.length > 0 && (
                          <Link
                            href={`/dashboard/pros/${bid.pro.id}`}
                            className="mt-2 flex items-center gap-1.5"
                            aria-label={`View ${bid.pro.name}'s work`}
                          >
                            {bid.pro.photos.map((url, i) => (
                              <span
                                key={i}
                                className="relative size-8 overflow-hidden rounded-lg border border-line"
                              >
                                <Image src={url} alt="" fill sizes="32px" className="object-cover" />
                              </span>
                            ))}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold text-ink">
                        {formatCurrency(bid.amount)}
                      </p>
                      {delta != null ? (
                        <p className="text-[10.5px] text-ink-3">
                          +{formatCurrency(delta)} vs. lead
                        </p>
                      ) : rank === 1 ? (
                        <p className="text-[10.5px] font-medium text-success">
                          Leading bid
                        </p>
                      ) : (
                        <BidStatusPill status={bid.status} />
                      )}
                    </div>
                  </div>

                  <p className="mt-3.5 rounded-xl bg-paper px-4 py-3 text-[13.5px] leading-relaxed text-ink-2">
                    “{bid.message}”
                  </p>

                  <div className="mt-3.5 flex items-center justify-between">
                    <p className="text-[11.5px] text-ink-3">{bid.createdAgo}</p>
                    {accepting && bid.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={busyId === bid.id}
                          onClick={() => setPendingDecline(bid)}
                        >
                          <ThumbsDown className="size-3.5" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          disabled={busyId !== null}
                          onClick={() => setPendingAccept(bid)}
                        >
                          <ThumbsUp className="size-3.5" />
                          Accept bid
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={pendingAccept !== null}
        onClose={() => setPendingAccept(null)}
        onConfirm={acceptBid}
        title={`Award this job to ${pendingAccept?.pro.name ?? ""}?`}
        description={`They'll be booked for ${pendingAccept ? formatCurrency(pendingAccept.amount) : ""}, and all other bids will be politely declined. This can't be undone.`}
        confirmLabel="Accept & award"
        tone="primary"
      />

      <ConfirmDialog
        open={pendingDecline !== null}
        onClose={() => setPendingDecline(null)}
        onConfirm={() => declineBid(pendingDecline!)}
        title={`Decline ${pendingDecline?.pro.name ?? "this"}'s bid?`}
        description="They'll be notified they weren't selected. This can't be undone."
        confirmLabel="Decline bid"
        tone="danger"
      />
    </div>
  );
}

function WinningBidCard({ bid }: { bid: BidWithPro }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-success/25 bg-success-soft p-5"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-success">
        <Award className="size-4" />
        Winning bid
      </div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={bid.pro.name} hue={bid.pro.avatarHue} size="lg" />
          <div>
            <p className="text-sm font-semibold text-ink">{bid.pro.name}</p>
            <p className="mt-0.5 text-xs text-ink-3">
              {bid.pro.location ?? "Local pro"} · {bid.pro.jobsCompleted} jobs done
            </p>
          </div>
        </div>
        <p className="font-display text-2xl font-semibold text-success">
          {formatCurrency(bid.amount)}
        </p>
      </div>
      <p className="mt-3.5 rounded-xl bg-surface/70 px-4 py-3 text-[13.5px] leading-relaxed text-ink-2">
        “{bid.message}”
      </p>
    </motion.div>
  );
}
