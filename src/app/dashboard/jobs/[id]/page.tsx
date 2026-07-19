import { desc, eq } from "drizzle-orm";
import {
  ArrowLeft,
  Calendar,
  Eye,
  MapPin,
  Receipt,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BidBoard } from "@/components/dashboard/bid-board";
import { JobAdmin } from "@/components/dashboard/job-admin";
import { ProBidSection } from "@/components/dashboard/pro-bid-section";
import { Avatar } from "@/components/ui/avatar";
import { CategoryPill, JobStatusPill } from "@/components/ui/pill";
import { db } from "@/db";
import { bids, jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toClientSummary, toJobCardData, toProSummary } from "@/lib/serialize";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const { id } = await params;
  const rows = await db
    .select({ job: jobs, client: users })
    .from(jobs)
    .innerJoin(users, eq(jobs.clientId, users.id))
    .where(eq(jobs.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) notFound();

  const { job, client } = row;
  const isOwner = job.clientId === user.id;
  const isPro = user.role === "professional";

  const bidRows = await db
    .select({ bid: bids, pro: users })
    .from(bids)
    .innerJoin(users, eq(bids.proId, users.id))
    .where(eq(bids.jobId, job.id))
    .orderBy(desc(bids.createdAt));

  const activeBidCount = bidRows.filter(
    (b) => b.bid.status === "pending" || b.bid.status === "accepted",
  ).length;

  const myBidRow = bidRows.find((b) => b.bid.proId === user.id);

  const cardData = toJobCardData(job, client, bidRows.length);
  const boardBids = bidRows.map(({ bid, pro }) => ({
    id: bid.id,
    amount: bid.amount,
    message: bid.message,
    status: bid.status,
    createdAt: bid.createdAt.toISOString(),
    createdAgo: timeAgo(bid.createdAt),
    pro: toProSummary(pro),
  }));

  const meta = [
    { icon: MapPin, label: "Location", value: job.location },
    { icon: Calendar, label: "Preferred date", value: formatDate(job.preferredDate) },
    {
      icon: Receipt,
      label: "Budget",
      value: `${formatCurrency(job.budgetMin)} - ${formatCurrency(job.budgetMax)}`,
    },
    { icon: Timer, label: "Posted", value: timeAgo(job.createdAt) },
  ];

  return (
    <div>
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        {isOwner ? "Back to my jobs" : "Back to the job board"}
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <CategoryPill value={job.category} />
        <JobStatusPill status={job.status} />
      </div>
      <h1 className="mt-3 max-w-3xl font-display text-[30px] font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
        {job.title}
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {meta.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-line bg-surface p-3.5"
              >
                <m.icon className="size-4 text-ink-3" />
                <p className="mt-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                  {m.label}
                </p>
                <p className="mt-0.5 text-[13px] font-semibold leading-snug text-ink">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              The brief
            </h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">
              {job.description}
            </p>
          </div>

          {/* Bids */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-ink">
                {isOwner ? `Bids (${boardBids.length})` : "Bidding activity"}
              </h2>
            </div>
            {isOwner ? (
              <BidBoard
                bids={boardBids}
                jobStatus={job.status}
                currencyNote={`budget ${formatCurrency(job.budgetMin)}-${formatCurrency(job.budgetMax)}`}
              />
            ) : (
              <div className="flex items-center gap-3.5 rounded-2xl border border-dashed border-line-strong bg-surface/60 p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-ink/[0.06] text-ink-2">
                  <Eye className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {activeBidCount} active bid{activeBidCount === 1 ? "" : "s"} on this job
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-2">
                    Bids are private between each pro and the client. Make yours count.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {isOwner && <JobAdmin job={cardData} />}
          {isPro && !isOwner && (
            <ProBidSection
              jobId={job.id}
              jobStatus={job.status}
              budgetMin={job.budgetMin}
              budgetMax={job.budgetMax}
              clientName={client.name}
              myBid={
                myBidRow
                  ? {
                      id: myBidRow.bid.id,
                      amount: myBidRow.bid.amount,
                      message: myBidRow.bid.message,
                      status: myBidRow.bid.status,
                    }
                  : null
              }
            />
          )}

          {/* Client card */}
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              Posted by
            </p>
            <div className="mt-3.5 flex items-center gap-3">
              <Avatar
                name={client.name}
                hue={client.avatarHue}
                size="lg"
              />
              <div>
                <p className="text-sm font-semibold text-ink">{client.name}</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {toClientSummary(client).location ?? "Local client"} · member since{" "}
                  {formatDate(client.createdAt)}
                </p>
              </div>
            </div>
            {client.bio ? (
              <p className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-ink-2">
                {client.bio}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
