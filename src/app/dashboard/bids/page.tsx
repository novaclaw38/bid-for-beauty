import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Compass, Gavel } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BidStatusPill, CategoryPill, JobStatusPill } from "@/components/ui/pill";
import { toggleChipClasses } from "@/components/ui/toggle-chip";
import { db } from "@/db";
import { bids, jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "My Bids" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "All bids" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Won" },
  { value: "declined", label: "Not selected" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export default async function MyBidsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "professional") redirect("/dashboard");

  const { f = "all" } = await searchParams;

  const rows = await db
    .select({ bid: bids, job: jobs, client: users })
    .from(bids)
    .innerJoin(jobs, eq(bids.jobId, jobs.id))
    .innerJoin(users, eq(jobs.clientId, users.id))
    .where(eq(bids.proId, user.id))
    .orderBy(desc(bids.createdAt));

  const countByStatus = new Map<string, number>();
  for (const r of rows) {
    countByStatus.set(r.bid.status, (countByStatus.get(r.bid.status) ?? 0) + 1);
  }

  const filtered = rows.filter((r) => f === "all" || r.bid.status === f);

  return (
    <div>
      <PageHeader
        title="My Bids"
        description="Track every offer you've made: pending pitches, wins, and near misses."
        action={
          <Link href="/dashboard/jobs">
            <Button variant="secondary">
              <Compass className="size-4" />
              Browse jobs
            </Button>
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No bids yet"
          description="Nothing bid yet. Find a job on the board and make your first offer."
          action={
            <Link href="/dashboard/jobs">
              <Button>Browse open jobs</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const active = f === filter.value;
              const count =
                filter.value === "all"
                  ? rows.length
                  : (countByStatus.get(filter.value) ?? 0);
              return (
                <Link
                  key={filter.value}
                  href={filter.value === "all" ? "?" : `?f=${filter.value}`}
                  scroll={false}
                  className={toggleChipClasses(active)}
                >
                  {filter.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-semibold",
                      active ? "bg-cream/15 text-cream" : "bg-ink/[0.06] text-ink-3",
                    )}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="Nothing here yet"
              description="No bids with this status — try another tab."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map(({ bid, job, client }) => (
                <Link
                  key={bid.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="card-hover group flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-5"
                >
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="truncate text-[15px] font-semibold text-ink group-hover:text-brand">
                      {job.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                      <CategoryPill value={job.category} />
                      <span>{client.name}</span>
                      <span>·</span>
                      <span>{timeAgo(bid.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <JobStatusPill status={job.status} />
                    <BidStatusPill status={bid.status} />
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                      Your bid
                    </p>
                    <p className="font-display text-xl font-semibold text-ink">
                      {formatCurrency(bid.amount)}
                    </p>
                    <p className="text-[11px] text-ink-3">
                      budget {formatCurrency(job.budgetMin)}–
                      {formatCurrency(job.budgetMax)} · {categoryLabel(job.category)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
